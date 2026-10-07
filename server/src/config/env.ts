import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
  databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/nextera_coders_dev',
  mongodbDnsServers: process.env.MONGODB_DNS_SERVERS || '',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_key_nextera_coders_learning',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: process.env.COOKIE_NAME || 'nextera_auth_token',

  // Redis & Queue Configuration
  redisUrl: process.env.REDIS_URL || '',
  redisHost: process.env.REDIS_HOST || '127.0.0.1',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),

  // Seeding
  adminSeedEmail: process.env.ADMIN_SEED_EMAIL || 'nexteracoders@gmail.com',
  adminSeedPassword: process.env.ADMIN_SEED_PASSWORD || 'Nextera@123',
  studentSeedEmail: process.env.STUDENT_SEED_EMAIL || 'student@nexteracoders.com',
  studentSeedPassword: process.env.STUDENT_SEED_PASSWORD || 'Student@NextEra2026!',

  // Email & SMTP Configuration
  smtpService: process.env.SMTP_SERVICE || '',
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '465', 10),
  smtpSecure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || 'NextEra Coders <noreply@nexteracoders.com>',
  emailFromName: process.env.EMAIL_FROM_NAME || 'NextEra Coders',

  // AI Mentor & Gemini API Configuration
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
};

export const env = config;

