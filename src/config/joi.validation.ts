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

  // MongoDB Configurations
  MONGO_URI: Joi.string().required().description('MongoDB connection URI'),

  // Node Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .description('Node environment'),
});
