const express = require('express');
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - Get all users (Admin only)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { role, search, direktorat, subdirektorat } = req.query;
    
    let whereClause = {};
    
    // Filter by role
    if (role && role !== 'all') {
      whereClause.role = role;
    }
    
    // Filter by direktorat
    if (direktorat && direktorat !== 'all') {
      whereClause.direktorat = direktorat;
    }
    
    // Filter by subdirektorat
    if (subdirektorat && subdirektorat !== 'all') {
      whereClause.subdirektorat = subdirektorat;
    }
    
    // Search by name, username, or email
    if (search) {
      whereClause.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        email: true,
        nama: true,
        role: true,
        direktorat: true,
        subdirektorat: true,
        divisi: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            fileUploads: true,
            assignments: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { nama: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: users,
      total: users.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// GET /api/users/:id - Get specific user
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Users can only view their own profile, admins can view any profile
    if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        nama: true,
        role: true,
        direktorat: true,
        subdirektorat: true,
        divisi: true,
        createdAt: true,
        updatedAt: true,
        fileUploads: {
          select: {
            id: true,
            fileName: true,
            uploadDate: true,
            checklist: {
              select: {
                id: true,
                deskripsi: true,
                aspek: true,
                tahun: true
              }
            }
          }
        },
        assignments: {
          select: {
            id: true,
            status: true,
            assignedAt: true,
            checklist: {
              select: {
                id: true,
                deskripsi: true,
                aspek: true,
                tahun: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { nama, email, direktorat, subdirektorat, divisi, role } = req.body;

    // Users can only update their own profile, admins can update any profile
    if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Only admins can change roles
    if (role && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can change user roles'
      });
    }

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId }
        }
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists'
        });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        nama: nama || existingUser.nama,
        email: email || existingUser.email,
        direktorat: direktorat !== undefined ? direktorat : existingUser.direktorat,
        subdirektorat: subdirektorat !== undefined ? subdirektorat : existingUser.subdirektorat,
        divisi: divisi !== undefined ? divisi : existingUser.divisi,
        role: role || existingUser.role
      },
      select: {
        id: true,
        username: true,
        email: true,
        nama: true,
        role: true,
        direktorat: true,
        subdirektorat: true,
        divisi: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (req.user.id === userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    // Check if user has related data
    const hasRelatedData = await prisma.$transaction([
      prisma.fileUpload.count({ where: { uploadedBy: userId } }),
      prisma.assignment.count({ where: { assignedBy: userId } })
    ]);

    if (hasRelatedData.some(count => count > 0)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete user with existing data. Please reassign or delete related data first.'
      });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

// GET /api/users/:id/profile - Get user profile (for current user)
router.get('/profile/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        nama: true,
        role: true,
        direktorat: true,
        subdirektorat: true,
        divisi: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// PUT /api/users/profile/me - Update current user profile
router.put('/profile/me', verifyToken, async (req, res) => {
  try {
    const { nama, email, direktorat, subdirektorat, divisi } = req.body;

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: req.user.id }
        }
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists'
        });
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        nama: nama || req.user.nama,
        email: email || req.user.email,
        direktorat: direktorat !== undefined ? direktorat : req.user.direktorat,
        subdirektorat: subdirektorat !== undefined ? subdirektorat : req.user.subdirektorat,
        divisi: divisi !== undefined ? divisi : req.user.divisi
      },
      select: {
        id: true,
        username: true,
        email: true,
        nama: true,
        role: true,
        direktorat: true,
        subdirektorat: true,
        divisi: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

module.exports = router;


