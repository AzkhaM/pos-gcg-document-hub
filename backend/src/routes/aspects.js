const express = require('express');
const { prisma } = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/aspects - Get all aspects (with filters)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { tahun, search } = req.query;
    
    let whereClause = {};
    
    // Filter by year
    if (tahun) {
      whereClause.tahun = parseInt(tahun);
    }
    
    // Search by name
    if (search) {
      whereClause.nama = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const aspects = await prisma.aspek.findMany({
      where: whereClause,
      include: {
        year: true,
        _count: {
          select: {
            checklist: true
          }
        }
      },
      orderBy: [
        { tahun: 'desc' },
        { nama: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: aspects,
      total: aspects.length
    });
  } catch (error) {
    console.error('Get aspects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch aspects'
    });
  }
});

// GET /api/aspects/:id - Get specific aspect
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const aspectId = parseInt(req.params.id);
    
    const aspect = await prisma.aspek.findUnique({
      where: { id: aspectId },
      include: {
        year: true,
        checklist: {
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
                status: true
              }
            }
          }
        }
      }
    });

    if (!aspect) {
      return res.status(404).json({
        success: false,
        error: 'Aspect not found'
      });
    }

    res.json({
      success: true,
      data: aspect
    });
  } catch (error) {
    console.error('Get aspect error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch aspect'
    });
  }
});

// POST /api/aspects - Create new aspect (Admin only)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { nama, tahun } = req.body;

    // Validation
    if (!nama || !tahun) {
      return res.status(400).json({
        success: false,
        error: 'Nama and tahun are required'
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

    // Check if aspect already exists for the year
    const existingAspect = await prisma.aspek.findFirst({
      where: {
        nama,
        tahun: parseInt(tahun)
      }
    });

    if (existingAspect) {
      return res.status(400).json({
        success: false,
        error: 'Aspect already exists for the specified year'
      });
    }

    // Create aspect
    const newAspect = await prisma.aspek.create({
      data: {
        nama,
        tahun: parseInt(tahun)
      },
      include: {
        year: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Aspect created successfully',
      data: newAspect
    });

  } catch (error) {
    console.error('Create aspect error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create aspect'
    });
  }
});

// PUT /api/aspects/:id - Update aspect (Admin only)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const aspectId = parseInt(req.params.id);
    const { nama, tahun } = req.body;

    if (isNaN(aspectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid aspect ID'
      });
    }

    // Check if aspect exists
    const existingAspect = await prisma.aspek.findUnique({
      where: { id: aspectId }
    });

    if (!existingAspect) {
      return res.status(404).json({
        success: false,
        error: 'Aspect not found'
      });
    }

    // Validation
    if (!nama || !tahun) {
      return res.status(400).json({
        success: false,
        error: 'Nama and tahun are required'
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

    // Check if aspect name already exists for the year (excluding current aspect)
    const duplicateAspect = await prisma.aspek.findFirst({
      where: {
        nama,
        tahun: parseInt(tahun),
        id: { not: aspectId }
      }
    });

    if (duplicateAspect) {
      return res.status(400).json({
        success: false,
        error: 'Aspect name already exists for the specified year'
      });
    }

    // Update aspect
    const updatedAspect = await prisma.aspek.update({
      where: { id: aspectId },
      data: {
        nama,
        tahun: parseInt(tahun)
      },
      include: {
        year: true
      }
    });

    res.json({
      success: true,
      message: 'Aspect updated successfully',
      data: updatedAspect
    });

  } catch (error) {
    console.error('Update aspect error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update aspect'
    });
  }
});

// DELETE /api/aspects/:id - Delete aspect (Admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const aspectId = parseInt(req.params.id);

    if (isNaN(aspectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid aspect ID'
      });
    }

    // Check if aspect exists
    const existingAspect = await prisma.aspek.findUnique({
      where: { id: aspectId }
    });

    if (!existingAspect) {
      return res.status(404).json({
        success: false,
        error: 'Aspect not found'
      });
    }

    // Check if aspect has related checklist items
    const checklistCount = await prisma.checklistGCG.count({
      where: { aspek: existingAspect.nama, tahun: existingAspect.tahun }
    });

    if (checklistCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete aspect. It has ${checklistCount} related checklist items. Please delete or reassign checklist items first.`
      });
    }

    // Delete aspect
    await prisma.aspek.delete({
      where: { id: aspectId }
    });

    res.json({
      success: true,
      message: 'Aspect deleted successfully'
    });

  } catch (error) {
    console.error('Delete aspect error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete aspect'
    });
  }
});

// GET /api/aspects/:id/checklist - Get checklist items for specific aspect
router.get('/:id/checklist', verifyToken, async (req, res) => {
  try {
    const aspectId = parseInt(req.params.id);
    
    const aspect = await prisma.aspek.findUnique({
      where: { id: aspectId },
      include: {
        year: true,
        checklist: {
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
                status: true
              }
            }
          }
        }
      }
    });

    if (!aspect) {
      return res.status(404).json({
        success: false,
        error: 'Aspect not found'
      });
    }

    res.json({
      success: true,
      data: {
        aspect: {
          id: aspect.id,
          nama: aspect.nama,
          tahun: aspect.tahun,
          year: aspect.year
        },
        checklist: aspect.checklist,
        total: aspect.checklist.length
      }
    });

  } catch (error) {
    console.error('Get aspect checklist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch aspect checklist'
    });
  }
});

module.exports = router;


