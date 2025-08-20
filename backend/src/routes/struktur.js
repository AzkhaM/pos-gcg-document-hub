const express = require('express');
const { prisma } = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/struktur - Get all organizational structures (with filters)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { tahun, direktorat, subdirektorat, divisi } = req.query;
    
    let whereClause = {};
    
    // Filter by year
    if (tahun) {
      whereClause.tahun = parseInt(tahun);
    }
    
    // Filter by direktorat
    if (direktorat && direktorat !== 'all') {
      whereClause.direktorat = direktorat;
    }
    
    // Filter by subdirektorat
    if (subdirektorat && subdirektorat !== 'all') {
      whereClause.subdirektorat = subdirektorat;
    }
    
    // Filter by divisi
    if (divisi && divisi !== 'all') {
      whereClause.divisi = divisi;
    }

    const struktur = await prisma.strukturPerusahaan.findMany({
      where: whereClause,
      include: {
        year: true,
        _count: {
          select: {
            assignments: true
          }
        }
      },
      orderBy: [
        { tahun: 'desc' },
        { direktorat: 'asc' },
        { subdirektorat: 'asc' },
        { divisi: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: struktur,
      total: struktur.length
    });
  } catch (error) {
    console.error('Get struktur error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organizational structures'
    });
  }
});

// GET /api/struktur/:id - Get specific organizational structure
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const strukturId = parseInt(req.params.id);
    
    const struktur = await prisma.strukturPerusahaan.findUnique({
      where: { id: strukturId },
      include: {
        year: true,
        assignments: {
          include: {
            checklist: {
              select: {
                id: true,
                deskripsi: true,
                aspek: true,
                tahun: true
              }
            },
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

    if (!struktur) {
      return res.status(404).json({
        success: false,
        error: 'Organizational structure not found'
      });
    }

    res.json({
      success: true,
      data: struktur
    });
  } catch (error) {
    console.error('Get struktur error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organizational structure'
    });
  }
});

// POST /api/struktur - Create new organizational structure (Admin only)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { tahun, direktorat, subdirektorat, divisi } = req.body;

    // Validation
    if (!tahun || !direktorat || !subdirektorat) {
      return res.status(400).json({
        success: false,
        error: 'Tahun, direktorat, and subdirektorat are required'
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

    // Check if organizational structure already exists for the year
    const existingStruktur = await prisma.strukturPerusahaan.findFirst({
      where: {
        tahun: parseInt(tahun),
        direktorat,
        subdirektorat,
        divisi: divisi || null
      }
    });

    if (existingStruktur) {
      return res.status(400).json({
        success: false,
        error: 'Organizational structure already exists for the specified year'
      });
    }

    // Create organizational structure
    const newStruktur = await prisma.strukturPerusahaan.create({
      data: {
        tahun: parseInt(tahun),
        direktorat,
        subdirektorat,
        divisi: divisi || null
      },
      include: {
        year: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Organizational structure created successfully',
      data: newStruktur
    });

  } catch (error) {
    console.error('Create struktur error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create organizational structure'
    });
  }
});

// PUT /api/struktur/:id - Update organizational structure (Admin only)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const strukturId = parseInt(req.params.id);
    const { tahun, direktorat, subdirektorat, divisi } = req.body;

    if (isNaN(strukturId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid organizational structure ID'
      });
    }

    // Check if organizational structure exists
    const existingStruktur = await prisma.strukturPerusahaan.findUnique({
      where: { id: strukturId }
    });

    if (!existingStruktur) {
      return res.status(404).json({
        success: false,
        error: 'Organizational structure not found'
      });
    }

    // Validation
    if (!tahun || !direktorat || !subdirektorat) {
      return res.status(400).json({
        success: false,
        error: 'Tahun, direktorat, and subdirektorat are required'
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

    // Check if organizational structure already exists for the year (excluding current)
    const duplicateStruktur = await prisma.strukturPerusahaan.findFirst({
      where: {
        tahun: parseInt(tahun),
        direktorat,
        subdirektorat,
        divisi: divisi || null,
        id: { not: strukturId }
      }
    });

    if (duplicateStruktur) {
      return res.status(400).json({
        success: false,
        error: 'Organizational structure already exists for the specified year'
      });
    }

    // Update organizational structure
    const updatedStruktur = await prisma.strukturPerusahaan.update({
      where: { id: strukturId },
      data: {
        tahun: parseInt(tahun),
        direktorat,
        subdirektorat,
        divisi: divisi || null
      },
      include: {
        year: true
      }
    });

    res.json({
      success: true,
      message: 'Organizational structure updated successfully',
      data: updatedStruktur
    });

  } catch (error) {
    console.error('Update struktur error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update organizational structure'
    });
  }
});

// DELETE /api/struktur/:id - Delete organizational structure (Admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const strukturId = parseInt(req.params.id);

    if (isNaN(strukturId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid organizational structure ID'
      });
    }

    // Check if organizational structure exists
    const existingStruktur = await prisma.strukturPerusahaan.findUnique({
      where: { id: strukturId }
    });

    if (!existingStruktur) {
      return res.status(404).json({
        success: false,
        error: 'Organizational structure not found'
      });
    }

    // Check if organizational structure has related assignments
    const assignmentCount = await prisma.assignment.count({
      where: { strukturId }
    });

    if (assignmentCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete organizational structure. It has ${assignmentCount} related assignments. Please reassign or delete assignments first.`
      });
    }

    // Delete organizational structure
    await prisma.strukturPerusahaan.delete({
      where: { id: strukturId }
    });

    res.json({
      success: true,
      message: 'Organizational structure deleted successfully'
    });

  } catch (error) {
    console.error('Delete struktur error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete organizational structure'
    });
  }
});

// GET /api/struktur/:id/assignments - Get assignments for specific organizational structure
router.get('/:id/assignments', verifyToken, async (req, res) => {
  try {
    const strukturId = parseInt(req.params.id);
    
    const struktur = await prisma.strukturPerusahaan.findUnique({
      where: { id: strukturId },
      include: {
        year: true,
        assignments: {
          include: {
            checklist: {
              select: {
                id: true,
                deskripsi: true,
                aspek: true,
                tahun: true
              }
            },
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

    if (!struktur) {
      return res.status(404).json({
        success: false,
        error: 'Organizational structure not found'
      });
    }

    res.json({
      success: true,
      data: {
        struktur: {
          id: struktur.id,
          tahun: struktur.tahun,
          direktorat: struktur.direktorat,
          subdirektorat: struktur.subdirektorat,
          divisi: struktur.divisi,
          year: struktur.year
        },
        assignments: struktur.assignments,
        total: struktur.assignments.length
      }
    });

  } catch (error) {
    console.error('Get struktur assignments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organizational structure assignments'
    });
  }
});

// GET /api/struktur/stats/summary - Get organizational structure statistics
router.get('/stats/summary', verifyToken, async (req, res) => {
  try {
    const { tahun } = req.query;
    
    let whereClause = {};
    if (tahun) {
      whereClause.tahun = parseInt(tahun);
    }

    const [totalStruktur, direktoratCount, subdirektoratCount, divisiCount] = await prisma.$transaction([
      prisma.strukturPerusahaan.count({ where: whereClause }),
      prisma.strukturPerusahaan.groupBy({
        by: ['direktorat'],
        where: whereClause,
        _count: { direktorat: true }
      }),
      prisma.strukturPerusahaan.groupBy({
        by: ['subdirektorat'],
        where: whereClause,
        _count: { subdirektorat: true }
      }),
      prisma.strukturPerusahaan.groupBy({
        by: ['divisi'],
        where: whereClause,
        _count: { divisi: true }
      })
    ]);

    const stats = {
      total: totalStruktur,
      direktorat: direktoratCount.length,
      subdirektorat: subdirektoratCount.length,
      divisi: divisiCount.filter(d => d.divisi !== null).length,
      breakdown: {
        direktorat: direktoratCount.map(d => ({
          name: d.direktorat,
          count: d._count.direktorat
        })),
        subdirektorat: subdirektoratCount.map(s => ({
          name: s.subdirektorat,
          count: s._count.subdirektorat
        })),
        divisi: divisiCount
          .filter(d => d.divisi !== null)
          .map(d => ({
            name: d.divisi,
            count: d._count.divisi
          }))
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get struktur stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organizational structure statistics'
    });
  }
});

module.exports = router;


