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

  // Clerk Authentication
  CLERK_SECRET_KEY: Joi.string()
    .required()
    .description('Clerk secret key for backend authentication'),
  CLERK_PUBLISHABLE_KEY: Joi.string()
    .required()
    .description('Clerk publishable key'),
});
