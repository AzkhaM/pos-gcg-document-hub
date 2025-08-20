const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const { testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const yearRoutes = require('./routes/years');
const strukturRoutes = require('./routes/struktur');
const aspectRoutes = require('./routes/aspects');
const checklistRoutes = require('./routes/checklist');
const fileUploadRoutes = require('./routes/fileUploads');
const assignmentRoutes = require('./routes/assignments');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv 
  });
});

// API Base Info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'POS GCG Document Hub API',
    version: '1.0.0',
    environment: config.server.nodeEnv,
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      years: '/api/years',
      struktur: '/api/struktur',
      aspects: '/api/aspects',
      checklist: '/api/checklist',
      files: '/api/files',
      assignments: '/api/assignments'
    },
    documentation: 'All endpoints require authentication except /api/auth/login and /api/auth/register'
  });
});

// Public test endpoints (for development only)
if (config.server.nodeEnv === 'development') {
  app.get('/api/test/public', (req, res) => {
    res.json({
      message: 'This is a public endpoint for testing',
      timestamp: new Date().toISOString(),
      note: 'Available only in development mode'
    });
  });
  
  app.get('/api/test/db-status', async (req, res) => {
    try {
      const { testConnection } = require('./config/database');
      const isConnected = await testConnection();
      res.json({
        message: 'Database connection test',
        connected: isConnected,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Database test failed',
        message: error.message
      });
    }
  });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/years', yearRoutes);
app.use('/api/struktur', strukturRoutes);
app.use('/api/aspects', aspectRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/files', fileUploadRoutes);
app.use('/api/assignments', assignmentRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  res.status(statusCode).json({
    error: message,
    ...(config.server.nodeEnv === 'development' && { stack: error.stack })
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Cannot start server without database connection');
      process.exit(1);
    }

    const PORT = config.server.port;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${config.server.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();


