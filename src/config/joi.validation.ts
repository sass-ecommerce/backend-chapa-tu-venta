import * as Joi from 'joi';

export const ValidationSchema = Joi.object({
  // Application Configurations
  PORT: Joi.number().default(3000).description('HTTP server port'),
  // POSTGRESQL Configurations
  POSTGRES_PORT: Joi.number().required().description('HTTP server port'),
  POSTGRES_HOST: Joi.string().required().description('Database host'),
  POSTGRES_USER: Joi.string().required().description('Database username'),
  POSTGRES_PASSWORD: Joi.string().required().description('Database password'),
  POSTGRES_DB: Joi.string().required().description('Database name'),
  POSTGRES_SCHEMA: Joi.string().required().description('Database schema'),

  // MongoDB Configurations
  MONGO_URI: Joi.string().required().description('MongoDB connection URI'),

  // Node Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .description('Node environment'),

  // Passport.js JWT Authentication
  JWT_SECRET: Joi.string()
    .required()
    .description('JWT secret key for signing tokens'),
  JWT_ACCESS_TOKEN_EXPIRATION: Joi.string()
    .default('15m')
    .description('JWT access token expiration time (e.g., 15m, 1h)'),
  JWT_REFRESH_TOKEN_EXPIRATION_DAYS: Joi.number()
    .default(7)
    .description('Refresh token expiration in days'),
  BCRYPT_ROUNDS: Joi.number()
    .default(10)
    .min(4)
    .max(31)
    .description('Bcrypt salt rounds for password hashing'),

  // AWS SES Configurations
  AWS_REGION: Joi.string()
    .default('us-east-1')
    .description('AWS region for SES'),
  AWS_ACCESS_KEY_ID: Joi.string().required().description('AWS access key ID'),
  AWS_SECRET_ACCESS_KEY: Joi.string()
    .required()
    .description('AWS secret access key'),
  AWS_SES_FROM_EMAIL: Joi.string()
    .email()
    .required()
    .description('Verified email address for AWS SES'),
  AWS_SES_FROM_NAME: Joi.string()
    .default('Chapa Tu Venta')
    .description('Display name for email sender'),

  // OTP Configurations
  OTP_EXPIRATION_MINUTES: Joi.number()
    .default(5)
    .min(1)
    .max(30)
    .description('OTP expiration time in minutes'),
  OTP_MAX_ATTEMPTS: Joi.number()
    .default(3)
    .min(1)
    .max(10)
    .description('Maximum OTP verification attempts'),
  OTP_CODE_LENGTH: Joi.number()
    .default(6)
    .valid(4, 6, 8)
    .description('Length of OTP code'),
});
