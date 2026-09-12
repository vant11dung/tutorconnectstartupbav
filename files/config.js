/**
 * Configuration file cho TutorMate Backend
 * Contains all environment-specific settings
 */

require('dotenv').config();

const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tutormate',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    },
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: '7d',
    refreshExpiresIn: '30d',
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  
  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  
  // Password
  password: {
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  
  // Email
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
    from: process.env.EMAIL_FROM || 'noreply@tutormate.com',
    templates: {
      verifyEmail: 'verify-email',
      resetPassword: 'reset-password',
      appointmentConfirmation: 'appointment-confirmation',
    },
  },
  
  // File Upload
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || 5242880, // 5MB
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    allowedMimes: ['image/jpeg', 'image/png', 'application/pdf'],
  },
  
  // Payment (Stripe)
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhook: {
      secret: process.env.STRIPE_WEBHOOK_SECRET,
    },
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
  
  // Roles and Permissions
  roles: {
    student: ['read:own_profile', 'update:own_profile', 'create:appointment', 'read:appointments', 'create:message'],
    tutor: ['read:own_profile', 'update:own_profile', 'read:appointments', 'create:review', 'read:earnings'],
    admin: ['*'], // All permissions
  },
  
  // Feature Flags
  features: {
    videoCall: process.env.FEATURE_VIDEO_CALL === 'true',
    paymentGateway: process.env.FEATURE_PAYMENT === 'true',
    emailNotifications: process.env.FEATURE_EMAIL === 'true',
    pushNotifications: process.env.FEATURE_PUSH === 'true',
  },
};

/**
 * Validate configuration
 */
function validateConfig() {
  const errors = [];
  
  if (config.nodeEnv === 'production') {
    if (config.jwt.secret === 'your-secret-key-change-in-production') {
      errors.push('JWT_SECRET must be changed in production');
    }
    if (!config.stripe.secretKey) {
      errors.push('STRIPE_SECRET_KEY is required in production');
    }
  }
  
  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(error => console.error('  -', error));
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
  }
  
  return true;
}

/**
 * Get config for specific environment
 */
function getConfig(env = config.nodeEnv) {
  const envConfig = { ...config };
  
  switch (env) {
    case 'production':
      envConfig.cors.origin = process.env.CORS_ORIGIN || 'https://tutormate.com';
      break;
    case 'development':
      envConfig.cors.origin = '*';
      break;
    case 'test':
      envConfig.mongodb.uri = 'mongodb://localhost:27017/tutormate-test';
      break;
  }
  
  return envConfig;
}

// Validate on startup
if (require.main === module) {
  validateConfig();
  console.log(`Configuration loaded for ${config.nodeEnv} environment`);
}

module.exports = {
  config,
  validateConfig,
  getConfig,
};
