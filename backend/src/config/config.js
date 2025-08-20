require('dotenv').config();

module.exports = {
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || "postgresql://username:password@localhost:5432/pos_gcg_db",
    // Alternative MySQL: "mysql://username:password@localhost:3306/pos_gcg_db"
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || "your-super-secret-jwt-key-here-change-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || "development",
  },

  // File Upload Configuration
  upload: {
    path: process.env.UPLOAD_PATH || "./uploads",
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },
};


