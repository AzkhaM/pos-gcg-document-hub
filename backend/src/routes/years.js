const express = require('express');
const { prisma } = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/years - Get all years
router.get('/', verifyToken, async (req, res) => {
  try {
    const years = await prisma.year.findMany({
      orderBy: { tahun: 'desc' }
    });

    res.json({
      success: true,
      data: years
    });
  } catch (error) {
    console.error('Get years error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch years'
    });
  }
});

// GET /api/years/:tahun - Get specific year
router.get('/:tahun', verifyToken, async (req, res) => {
  try {
    const tahun = parseInt(req.params.tahun);
    
    if (isNaN(tahun)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year format'
      });
    }

    const year = await prisma.year.findUnique({
      where: { tahun },
      include: {
        aspects: true,
        checklist: true,
        struktur: true
      }
    });

    if (!year) {
      return res.status(404).json({
        success: false,
        error: 'Year not found'
      });
    }

    res.json({
      success: true,
      data: year
    });
  } catch (error) {
    console.error('Get year error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch year'
    });
  }
});

// POST /api/years - Create new year (Admin only)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { tahun, nama, deskripsi } = req.body;

    // Validation
    if (!tahun) {
      return res.status(400).json({
        success: false,
        error: 'Year is required'
      });
    }

    if (isNaN(tahun) || tahun < 1900 || tahun > 2100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year format (1900-2100)'
      });
    }

    // Check if year already exists
    const existingYear = await prisma.year.findUnique({
      where: { tahun: parseInt(tahun) }
    });

    if (existingYear) {
      return res.status(400).json({
        success: false,
        error: 'Year already exists'
      });
    }

    // Create year
    const newYear = await prisma.year.create({
      data: {
        tahun: parseInt(tahun),
        nama: nama || `Tahun Buku ${tahun}`,
        deskripsi: deskripsi || `Tahun buku ${tahun}`
      }
    });

    res.status(201).json({
      success: true,
      message: 'Year created successfully',
      data: newYear
    });

  } catch (error) {
    console.error('Create year error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create year'
    });
  }
});

// PUT /api/years/:tahun - Update year (Admin only)
router.put('/:tahun', verifyToken, requireAdmin, async (req, res) => {
  try {
    const tahun = parseInt(req.params.tahun);
    const { nama, deskripsi, isActive } = req.body;

    if (isNaN(tahun)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year format'
      });
    }

    // Check if year exists
    const existingYear = await prisma.year.findUnique({
      where: { tahun }
    });

    if (!existingYear) {
      return res.status(404).json({
        success: false,
        error: 'Year not found'
      });
    }

    // Update year
    const updatedYear = await prisma.year.update({
      where: { tahun },
      data: {
        nama: nama !== undefined ? nama : existingYear.nama,
        deskripsi: deskripsi !== undefined ? deskripsi : existingYear.deskripsi,
        isActive: isActive !== undefined ? isActive : existingYear.isActive
      }
    });

    res.json({
      success: true,
      message: 'Year updated successfully',
      data: updatedYear
    });

  } catch (error) {
    console.error('Update year error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update year'
    });
  }
});

// DELETE /api/years/:tahun - Delete year (Admin only)
router.delete('/:tahun', verifyToken, requireAdmin, async (req, res) => {
  try {
    const tahun = parseInt(req.params.tahun);

    if (isNaN(tahun)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year format'
      });
    }

    // Check if year exists
    const existingYear = await prisma.year.findUnique({
      where: { tahun }
    });

    if (!existingYear) {
      return res.status(404).json({
        success: false,
        error: 'Year not found'
      });
    }

    // Check if year has related data
    const hasRelatedData = await prisma.$transaction([
      prisma.aspek.count({ where: { tahun } }),
      prisma.checklistGCG.count({ where: { tahun } }),
      prisma.strukturPerusahaan.count({ where: { tahun } })
    ]);

    if (hasRelatedData.some(count => count > 0)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete year with existing data. Please delete related data first.'
      });
    }

    // Delete year
    await prisma.year.delete({
      where: { tahun }
    });

    res.json({
      success: true,
      message: 'Year deleted successfully'
    });

  } catch (error) {
    console.error('Delete year error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete year'
    });
  }
});

// GET /api/years/:tahun/stats - Get year statistics
router.get('/:tahun/stats', verifyToken, async (req, res) => {
  try {
    const tahun = parseInt(req.params.tahun);

    if (isNaN(tahun)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year format'
      });
    }

    // Get statistics
    const [aspectsCount, checklistCount, strukturCount, usersCount] = await prisma.$transaction([
      prisma.aspek.count({ where: { tahun } }),
      prisma.checklistGCG.count({ where: { tahun } }),
      prisma.strukturPerusahaan.count({ where: { tahun } }),
      prisma.user.count()
    ]);

    res.json({
      success: true,
      data: {
        tahun,
        aspectsCount,
        checklistCount,
        strukturCount,
        usersCount,
        progress: {
          aspects: aspectsCount > 0 ? 100 : 0,
          checklist: checklistCount > 0 ? 100 : 0,
          struktur: strukturCount > 0 ? 100 : 0
        }
      }
    });

  } catch (error) {
    console.error('Get year stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch year statistics'
    });
  }
});

module.exports = router;


