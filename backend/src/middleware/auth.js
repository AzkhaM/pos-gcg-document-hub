const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { prisma } = require('../config/database');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access token required' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          nama: true,
          direktorat: true,
          subdirektorat: true,
          divisi: true
        }
      });

      if (!user) {
        return res.status(401).json({ 
          error: 'User not found' 
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expired' 
        });
      }
      return res.status(401).json({ 
        error: 'Invalid token' 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed' 
    });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Admin access required' 
    });
  }
  next();
};

// Check if user can access specific year data
const requireYearAccess = (req, res, next) => {
  const year = parseInt(req.params.year || req.body.tahun);
  
  if (!year) {
    return res.status(400).json({ 
      error: 'Year parameter required' 
    });
  }

  // For now, allow all authenticated users to access year data
  // You can add more specific logic here later
  req.year = year;
  next();
};

// Check if user can access specific checklist item
const requireChecklistAccess = async (req, res, next) => {
  try {
    const checklistId = parseInt(req.params.id || req.body.checklistId);
    
    if (!checklistId) {
      return res.status(400).json({ 
        error: 'Checklist ID required' 
      });
    }

    const checklist = await prisma.checklistGCG.findUnique({
      where: { id: checklistId },
      include: {
        assignments: {
          include: {
            struktur: true
          }
        }
      }
    });

    if (!checklist) {
      return res.status(404).json({ 
        error: 'Checklist not found' 
      });
    }

    // Admin can access all checklist items
    if (req.user.role === 'ADMIN') {
      req.checklist = checklist;
      return next();
    }

    // Check if user has assignment for this checklist
    const hasAssignment = checklist.assignments.some(assignment => {
      const struktur = assignment.struktur;
      return (
        struktur.direktorat === req.user.direktorat &&
        struktur.subdirektorat === req.user.subdirektorat &&
        (!struktur.divisi || struktur.divisi === req.user.divisi)
      );
    });

    if (!hasAssignment) {
      return res.status(403).json({ 
        error: 'Access denied to this checklist item' 
      });
    }

    req.checklist = checklist;
    next();
  } catch (error) {
    console.error('Checklist access middleware error:', error);
    return res.status(500).json({ 
      error: 'Access check failed' 
    });
  }
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireYearAccess,
  requireChecklistAccess
};


