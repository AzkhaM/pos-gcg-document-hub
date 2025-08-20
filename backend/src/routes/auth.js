const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const config = require('../config/config');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/auth - Get auth endpoints info
router.get('/', (req, res) => {
  res.json({
    message: 'Authentication API',
    endpoints: {
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register',
      me: 'GET /api/auth/me',
      changePassword: 'POST /api/auth/change-password',
      validatePassword: 'POST /api/auth/validate-password'
    },
    note: 'Most endpoints require authentication token in Authorization header'
  });
});

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

// Helper function to hash password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Helper function to compare password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Helper function to validate password strength
const validatePassword = (password) => {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  let strength = 0;
  if (hasUpperCase) strength++;
  if (hasLowerCase) strength++;
  if (hasNumbers) strength++;
  if (hasSpecialChar) strength++;
  
  if (strength < 2) {
    return { valid: false, message: 'Password is too weak. Include uppercase, lowercase, numbers, and special characters' };
  }
  
  return { valid: true, strength };
};

// Helper function to generate random password
const generateRandomPassword = () => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each category
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
  
  // Fill the rest randomly
  for (let i = 4; i < 12; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// POST /api/auth/register - Register new user (Admin only)
router.post('/register', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, nama, direktorat, subdirektorat, divisi, role } = req.body;

    // Validation
    if (!username || !email || !password || !nama) {
      return res.status(400).json({
        error: 'Username, email, password, and nama are required'
      });
    }

    // Check password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: passwordValidation.message
      });
    }

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        error: existingUser.username === username ? 'Username already exists' : 'Email already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        nama,
        direktorat: direktorat || null,
        subdirektorat: subdirektorat || null,
        divisi: divisi || null,
        role: role || 'USER'
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
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: 'Failed to create user'
    });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username } // Allow login with email too
        ]
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user data (without password) and token
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      nama: user.nama,
      role: user.role,
      direktorat: user.direktorat,
      subdirektorat: user.subdirektorat,
      divisi: user.divisi
    };

    res.json({
      message: 'Login successful',
      user: userData,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed'
    });
  }
});

// POST /api/auth/generate-password - Generate random password
router.post('/generate-password', (req, res) => {
  try {
    const password = generateRandomPassword();
    const validation = validatePassword(password);
    
    res.json({
      password,
      strength: validation.strength,
      message: 'Password generated successfully'
    });
  } catch (error) {
    console.error('Generate password error:', error);
    res.status(500).json({
      error: 'Failed to generate password'
    });
  }
});

// POST /api/auth/validate-password - Validate password strength
router.post('/validate-password', (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        error: 'Password is required'
      });
    }

    const validation = validatePassword(password);
    
    res.json({
      valid: validation.valid,
      strength: validation.strength,
      message: validation.message
    });
  } catch (error) {
    console.error('Validate password error:', error);
    res.status(500).json({
      error: 'Failed to validate password'
    });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', verifyToken, async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      error: 'Failed to get user info'
    });
  }
});

// POST /api/auth/change-password - Change user password
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required'
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Current password is incorrect'
      });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: passwordValidation.message
      });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    });

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Failed to change password'
    });
  }
});

module.exports = router;


