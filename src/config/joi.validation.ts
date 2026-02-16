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
});
