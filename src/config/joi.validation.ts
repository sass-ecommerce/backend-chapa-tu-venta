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

  // AWS DynamoDB
  AWS_DYNAMODB_TABLE_NAME: Joi.string()
    .required()
    .description('DynamoDB table name for user-tenant replica'),

  // AWS S3
  AWS_S3_BUCKET_NAME: Joi.string().required().description('AWS S3 bucket name'),
  AWS_S3_UPLOAD_URL_EXPIRES_IN: Joi.number()
    .default(900)
    .description('Presigned upload URL TTL in seconds'),
  AWS_S3_DOWNLOAD_URL_EXPIRES_IN: Joi.number()
    .default(3600)
    .description('Presigned download URL TTL in seconds'),
});
