const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { prisma } = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const config = require('../config/config');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common document formats
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only documents and images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize // 10MB default
  }
});

// GET /api/files - Get all file uploads (with filters)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { tahun, checklistId, uploadedBy, search } = req.query;
    
    let whereClause = {};
    
    // Filter by year
    if (tahun) {
      whereClause.tahun = parseInt(tahun);
    }
    
    // Filter by checklist
    if (checklistId) {
      whereClause.checklistId = parseInt(checklistId);
    }
    
    // Filter by uploader
    if (uploadedBy) {
      whereClause.uploadedBy = parseInt(uploadedBy);
    }
    
    // Search by filename
    if (search) {
      whereClause.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const files = await prisma.fileUpload.findMany({
      where: whereClause,
      include: {
        checklist: {
          select: {
            id: true,
            deskripsi: true,
            aspek: true,
            tahun: true
          }
        },
        user: {
          select: {
            id: true,
            nama: true,
            username: true
          }
        }
      },
      orderBy: [
        { uploadDate: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: files,
      total: files.length
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch files'
    });
  }
});

// GET /api/files/:id - Get specific file upload
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    
    const file = await prisma.fileUpload.findUnique({
      where: { id: fileId },
      include: {
        checklist: {
          select: {
            id: true,
            deskripsi: true,
            aspek: true,
            tahun: true
          }
        },
        user: {
          select: {
            id: true,
            nama: true,
            username: true
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch file'
    });
  }
});

// POST /api/files/upload - Upload new file
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { checklistId, tahun } = req.body;

    // Validation
    if (!checklistId || !tahun) {
      return res.status(400).json({
        success: false,
        error: 'Checklist ID and tahun are required'
      });
    }

    if (isNaN(checklistId) || isNaN(tahun)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid checklist ID or tahun format'
      });
    }

    // Check if checklist exists
    const checklist = await prisma.checklistGCG.findUnique({
      where: { id: parseInt(checklistId) }
    });

    if (!checklist) {
      return res.status(400).json({
        success: false,
        error: 'Checklist not found'
      });
    }

    // Check if checklist year matches
    if (checklist.tahun !== parseInt(tahun)) {
      return res.status(400).json({
        success: false,
        error: 'Checklist year does not match'
      });
    }

    // Create file upload record
    const newFile = await prisma.fileUpload.create({
      data: {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        checklistId: parseInt(checklistId),
        tahun: parseInt(tahun),
        uploadedBy: req.user.id
      },
      include: {
        checklist: {
          select: {
            id: true,
            deskripsi: true,
            aspek: true,
            tahun: true
          }
        },
        user: {
          select: {
            id: true,
            nama: true,
            username: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: newFile
    });

  } catch (error) {
    console.error('Upload file error:', error);
    
    // Clean up uploaded file if database operation fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload file'
    });
  }
});

// DELETE /api/files/:id - Delete file upload
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);

    if (isNaN(fileId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file ID'
      });
    }

    // Check if file exists
    const existingFile = await prisma.fileUpload.findUnique({
      where: { id: fileId },
      include: {
        user: {
          select: {
            id: true,
            role: true
          }
        }
      }
    });

    if (!existingFile) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Check permissions: users can only delete their own files, admins can delete any
    if (req.user.role !== 'ADMIN' && req.user.id !== existingFile.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only delete your own files.'
      });
    }

    // Delete physical file
    try {
      if (fs.existsSync(existingFile.filePath)) {
        fs.unlinkSync(existingFile.filePath);
      }
    } catch (fileError) {
      console.error('Error deleting physical file:', fileError);
      // Continue with database deletion even if physical file deletion fails
    }

    // Delete database record
    await prisma.fileUpload.delete({
      where: { id: fileId }
    });

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
});

// GET /api/files/:id/download - Download file
router.get('/:id/download', verifyToken, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);

    if (isNaN(fileId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file ID'
      });
    }

    const file = await prisma.fileUpload.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Check if physical file exists
    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Physical file not found'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Length', file.fileSize);

    // Stream file to response
    const fileStream = fs.createReadStream(file.filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download file'
    });
  }
});

// GET /api/files/stats/summary - Get file upload statistics
router.get('/stats/summary', verifyToken, async (req, res) => {
  try {
    const { tahun } = req.query;
    
    let whereClause = {};
    if (tahun) {
      whereClause.tahun = parseInt(tahun);
    }

    const [totalFiles, totalSize, filesByType, filesByMonth] = await prisma.$transaction([
      prisma.fileUpload.count({ where: whereClause }),
      prisma.fileUpload.aggregate({
        where: whereClause,
        _sum: { fileSize: true }
      }),
      prisma.fileUpload.groupBy({
        by: ['mimeType'],
        where: whereClause,
        _count: { mimeType: true }
      }),
      prisma.fileUpload.groupBy({
        by: ['uploadDate'],
        where: whereClause,
        _count: { uploadDate: true }
      })
    ]);

    const stats = {
      total: totalFiles,
      totalSize: totalSize._sum.fileSize || 0,
      averageSize: totalFiles > 0 ? Math.round((totalSize._sum.fileSize || 0) / totalFiles) : 0,
      filesByType: filesByType.map(f => ({
        type: f.mimeType,
        count: f._count.mimeType
      })),
      filesByMonth: filesByMonth.map(f => ({
        month: f.uploadDate,
        count: f._count.uploadDate
      }))
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get file stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch file statistics'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size is ${Math.round(config.upload.maxFileSize / 1024 / 1024)}MB`
      });
    }
    return res.status(400).json({
      success: false,
      error: 'File upload error: ' + error.message
    });
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  next(error);
});

module.exports = router;


