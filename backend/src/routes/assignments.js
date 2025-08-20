const express = require('express');
const { prisma } = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/assignments - Get all assignments (with filters)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { tahun, checklistId, strukturId, status, assignedBy } = req.query;
    
    let whereClause = {};
    
    // Filter by year
    if (tahun) {
      whereClause.checklist = {
        tahun: parseInt(tahun)
      };
    }
    
    // Filter by checklist
    if (checklistId) {
      whereClause.checklistId = parseInt(checklistId);
    }
    
    // Filter by organizational structure
    if (strukturId) {
      whereClause.strukturId = parseInt(strukturId);
    }
    
    // Filter by status
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    // Filter by assigned by
    if (assignedBy) {
      whereClause.assignedBy = parseInt(assignedBy);
    }

    const assignments = await prisma.assignment.findMany({
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
        struktur: {
          select: {
            id: true,
            direktorat: true,
            subdirektorat: true,
            divisi: true,
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
      },
      orderBy: [
        { assignedAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: assignments,
      total: assignments.length
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assignments'
    });
  }
});

// GET /api/assignments/:id - Get specific assignment
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id);
    
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        checklist: {
          select: {
            id: true,
            deskripsi: true,
            aspek: true,
            tahun: true
          }
        },
        struktur: {
          select: {
            id: true,
            direktorat: true,
            subdirektorat: true,
            divisi: true,
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
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assignment'
    });
  }
});

// POST /api/assignments - Create new assignment (Admin only)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { checklistId, strukturId, dueDate, notes } = req.body;

    // Validation
    if (!checklistId || !strukturId) {
      return res.status(400).json({
        success: false,
        error: 'Checklist ID and Struktur ID are required'
      });
    }

    if (isNaN(checklistId) || isNaN(strukturId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid checklist ID or Struktur ID format'
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

    // Check if organizational structure exists
    const struktur = await prisma.strukturPerusahaan.findUnique({
      where: { id: parseInt(strukturId) }
    });

    if (!struktur) {
      return res.status(400).json({
        success: false,
        error: 'Organizational structure not found'
      });
    }

    // Check if years match
    if (checklist.tahun !== struktur.tahun) {
      return res.status(400).json({
        success: false,
        error: 'Checklist and organizational structure years do not match'
      });
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        checklistId: parseInt(checklistId),
        strukturId: parseInt(strukturId)
      }
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        error: 'Assignment already exists for this checklist and organizational structure'
      });
    }

    // Create assignment
    const newAssignment = await prisma.assignment.create({
      data: {
        checklistId: parseInt(checklistId),
        strukturId: parseInt(strukturId),
        assignedBy: req.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null
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
        struktur: {
          select: {
            id: true,
            direktorat: true,
            subdirektorat: true,
            divisi: true,
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
    });

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: newAssignment
    });

  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create assignment'
    });
  }
});

// PUT /api/assignments/:id - Update assignment (Admin only)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id);
    const { status, dueDate, notes } = req.body;

    if (isNaN(assignmentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid assignment ID'
      });
    }

    // Check if assignment exists
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });

    if (!existingAssignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Update assignment
    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        status: status || existingAssignment.status,
        dueDate: dueDate ? new Date(dueDate) : existingAssignment.dueDate,
        notes: notes !== undefined ? notes : existingAssignment.notes
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
        struktur: {
          select: {
            id: true,
            direktorat: true,
            subdirektorat: true,
            divisi: true,
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
    });

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: updatedAssignment
    });

  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update assignment'
    });
  }
});

// DELETE /api/assignments/:id - Delete assignment (Admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id);

    if (isNaN(assignmentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid assignment ID'
      });
    }

    // Check if assignment exists
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });

    if (!existingAssignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Delete assignment
    await prisma.assignment.delete({
      where: { id: assignmentId }
    });

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });

  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete assignment'
    });
  }
});

// PATCH /api/assignments/:id/status - Update assignment status
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id);
    const { status } = req.body;

    if (isNaN(assignmentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid assignment ID'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    // Check if assignment exists
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        struktur: true
      }
    });

    if (!existingAssignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Check if user has permission to update this assignment
    // Users can only update assignments for their organizational structure
    if (req.user.role !== 'ADMIN') {
      const userStruktur = await prisma.strukturPerusahaan.findFirst({
        where: {
          tahun: existingAssignment.struktur.tahun,
          direktorat: req.user.direktorat,
          subdirektorat: req.user.subdirektorat,
          divisi: req.user.divisi
        }
      });

      if (!userStruktur || userStruktur.id !== existingAssignment.strukturId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only update assignments for your organizational structure.'
        });
      }
    }

    // Update assignment status
    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: { status },
      include: {
        checklist: {
          select: {
            id: true,
            deskripsi: true,
            aspek: true,
            tahun: true
          }
        },
        struktur: {
          select: {
            id: true,
            direktorat: true,
            subdirektorat: true,
            divisi: true,
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
    });

    res.json({
      success: true,
      message: 'Assignment status updated successfully',
      data: updatedAssignment
    });

  } catch (error) {
    console.error('Update assignment status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update assignment status'
    });
  }
});

// GET /api/assignments/stats/summary - Get assignment statistics
router.get('/stats/summary', verifyToken, async (req, res) => {
  try {
    const { tahun } = req.query;
    
    let whereClause = {};
    if (tahun) {
      whereClause.checklist = {
        tahun: parseInt(tahun)
      };
    }

    const [totalAssignments, assignmentsByStatus, assignmentsByMonth] = await prisma.$transaction([
      prisma.assignment.count({ where: whereClause }),
      prisma.assignment.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { status: true }
      }),
      prisma.assignment.groupBy({
        by: ['assignedAt'],
        where: whereClause,
        _count: { assignedAt: true }
      })
    ]);

    const stats = {
      total: totalAssignments,
      byStatus: assignmentsByStatus.map(s => ({
        status: s.status,
        count: s._count.status
      })),
      byMonth: assignmentsByMonth.map(m => ({
        month: m.assignedAt,
        count: m._count.assignedAt
      })),
      completionRate: totalAssignments > 0 
        ? Math.round((assignmentsByStatus.find(s => s.status === 'COMPLETED')?._count.status || 0) / totalAssignments * 100)
        : 0
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get assignment stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assignment statistics'
    });
  }
});

module.exports = router;


