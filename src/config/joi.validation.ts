import * as Joi from 'joi';

export const ValidationSchema = Joi.object({
  // Application
  PORT: Joi.number().default(3000).description('HTTP server port'),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .description('Node environment'),

  // PostgreSQL
  POSTGRES_URL: Joi.string()
    .required()
    .description('PostgreSQL connection string'),

  // AWS
  AWS_REGION: Joi.string().default('us-east-1').description('AWS region'),

  // AWS Cognito
  AWS_COGNITO_USER_POOL_ID: Joi.string()
    .required()
    .description('AWS Cognito User Pool ID (e.g. us-east-1_xxxxxxxxx)'),
  AWS_COGNITO_CLIENT_ID: Joi.string()
    .required()
    .description('AWS Cognito App Client ID'),
});
