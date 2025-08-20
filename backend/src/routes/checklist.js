const express = require('express');
const { prisma } = require('../config/database');
const { verifyToken, requireAdmin, requireChecklistAccess } = require('../middleware/auth');

const router = express.Router();

// GET /api/checklist - Get all checklist items (with filters)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { tahun, aspek, search } = req.query;
    
    let whereClause = {};
    
    // Filter by year
    if (tahun) {
      whereClause.tahun = parseInt(tahun);
    }
    
    // Filter by aspect
    if (aspek && aspek !== 'all') {
      whereClause.aspek = aspek;
    }
    
    // Search by description
    if (search) {
      whereClause.deskripsi = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const checklist = await prisma.checklistGCG.findMany({
      where: whereClause,
      include: {
        year: true,
        aspect: true,
        fileUploads: {
          include: {
            user: {
              select: {
                id: true,
                nama: true,
                username: true
              }
            }
          }
        },
        assignments: {
          include: {
            struktur: true,
            assignedByUser: {
              select: {
                id: true,
                nama: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: [
        { tahun: 'desc' },
        { aspek: 'asc' },
        { id: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: checklist,
      total: checklist.length
    });
  } catch (error) {
    console.error('Get checklist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch checklist'
    });
  }
});

// GET /api/checklist/:id - Get specific checklist item
router.get('/:id', verifyToken, requireChecklistAccess, async (req, res) => {
  try {
    const checklistId = parseInt(req.params.id);
    
    const checklist = await prisma.checklistGCG.findUnique({
      where: { id: checklistId },
      include: {
        year: true,
        aspect: true,
        fileUploads: {
          include: {
            user: {
              select: {
                id: true,
                nama: true,
                username: true
              }
            }
          }
        },
        assignments: {
          include: {
            struktur: true,
            assignedByUser: {
              select: {
                id: true,
                nama: true,
                username: true
              }
            }
          }
        }
      }
    });

    if (!checklist) {
      return res.status(404).json({
        success: false,
        error: 'Checklist item not found'
      });
    }

    res.json({
      success: true,
      data: checklist
    });
  } catch (error) {
    console.error('Get checklist item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch checklist item'
    });
  }
});

// POST /api/checklist - Create new checklist item (Admin only)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { aspek, deskripsi, tahun } = req.body;

    // Validation
    if (!aspek || !deskripsi || !tahun) {
      return res.status(400).json({
        success: false,
        error: 'Aspek, deskripsi, and tahun are required'
      });
    }

    if (isNaN(tahun)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year format'
      });
    }

    // Check if year exists
    const yearExists = await prisma.year.findUnique({
      where: { tahun: parseInt(tahun) }
    });

    if (!yearExists) {
      return res.status(400).json({
        success: false,
        error: 'Year does not exist'
      });
    }

    // Check if aspect exists for the year
    const aspectExists = await prisma.aspek.findFirst({
      where: {
        nama: aspek,
        tahun: parseInt(tahun)
      }
    });

    if (!aspectExists) {
      return res.status(400).json({
        success: false,
        error: 'Aspect does not exist for the specified year'
      });
    }

    // Create checklist item
    const newChecklist = await prisma.checklistGCG.create({
      data: {
        aspek,
        deskripsi,
        tahun: parseInt(tahun)
      },
      include: {
        year: true,
        aspect: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Checklist item created successfully',
      data: newChecklist
    });

  } catch (error) {
    console.error('Create checklist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checklist item'
    });
  }
});

// PUT /api/checklist/:id - Update checklist item (Admin only)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const checklistId = parseInt(req.params.id);
    const { aspek, deskripsi, tahun } = req.body;

    if (isNaN(checklistId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid checklist ID'
      });
    }

    // Check if checklist exists
    const existingChecklist = await prisma.checklistGCG.findUnique({
      where: { id: checklistId }
    });

    if (!existingChecklist) {
      return res.status(404).json({
        success: false,
        error: 'Checklist item not found'
      });
    }

    // Validation
    if (!aspek || !deskripsi || !tahun) {
      return res.status(400).json({
        success: false,
        error: 'Aspek, deskripsi, and tahun are required'
      });
    }

    if (isNaN(tahun)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year format'
      });
    }

    // Check if year exists
    const yearExists = await prisma.year.findUnique({
      where: { tahun: parseInt(tahun) }
    });

    if (!yearExists) {
      return res.status(400).json({
        success: false,
        error: 'Year does not exist'
      });
    }

    // Check if aspect exists for the year
    const aspectExists = await prisma.aspek.findFirst({
      where: {
        nama: aspek,
        tahun: parseInt(tahun)
      }
    });

    if (!aspectExists) {
      return res.status(400).json({
        success: false,
        error: 'Aspect does not exist for the specified year'
      });
    }

    // Update checklist item
    const updatedChecklist = await prisma.checklistGCG.update({
      where: { id: checklistId },
      data: {
        aspek,
        deskripsi,
        tahun: parseInt(tahun)
      },
      include: {
        year: true,
        aspect: true
      }
    });

    res.json({
      success: true,
      message: 'Checklist item updated successfully',
      data: updatedChecklist
    });

  } catch (error) {
    console.error('Update checklist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update checklist item'
    });
  }
});

// DELETE /api/checklist/:id - Delete checklist item (Admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const checklistId = parseInt(req.params.id);

    if (isNaN(checklistId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid checklist ID'
      });
    }

    // Check if checklist exists
    const existingChecklist = await prisma.checklistGCG.findUnique({
      where: { id: checklistId }
    });

    if (!existingChecklist) {
      return res.status(404).json({
        success: false,
        error: 'Checklist item not found'
      });
    }

    // Check if checklist has related data
    const hasRelatedData = await prisma.$transaction([
      prisma.fileUpload.count({ where: { checklistId } }),
      prisma.assignment.count({ where: { checklistId } })
    ]);

    if (hasRelatedData.some(count => count > 0)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete checklist item with existing files or assignments. Please delete related data first.'
      });
    }

    // Delete checklist item
    await prisma.checklistGCG.delete({
      where: { id: checklistId }
    });

    res.json({
      success: true,
      message: 'Checklist item deleted successfully'
    });

  } catch (error) {
    console.error('Delete checklist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete checklist item'
    });
  }
});

// GET /api/checklist/:id/status - Get checklist item status
router.get('/:id/status', verifyToken, async (req, res) => {
  try {
    const checklistId = parseInt(req.params.id);

    if (isNaN(checklistId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid checklist ID'
      });
    }

    const checklist = await prisma.checklistGCG.findUnique({
      where: { id: checklistId },
      include: {
        fileUploads: {
          select: {
            id: true,
            fileName: true,
            uploadDate: true
          }
        },
        assignments: {
          select: {
            id: true,
            status: true,
            assignedAt: true
          }
        }
      }
    });

    if (!checklist) {
      return res.status(404).json({
        success: false,
        error: 'Checklist item not found'
      });
    }

    const hasFiles = checklist.fileUploads.length > 0;
    const hasAssignments = checklist.assignments.length > 0;
    const isAssigned = hasAssignments && checklist.assignments.some(a => a.status === 'COMPLETED');

    const status = {
      uploaded: hasFiles,
      assigned: hasAssignments,
      completed: isAssigned,
      filesCount: checklist.fileUploads.length,
      assignmentsCount: checklist.assignments.length
    };

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Get checklist status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch checklist status'
    });
  }
});

module.exports = router;


