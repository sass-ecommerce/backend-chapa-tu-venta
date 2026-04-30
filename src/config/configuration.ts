import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  postgres: {
    url: process.env.POSTGRES_URL,
  },
}));

export const awsConfig = registerAs('aws', () => ({
  region: process.env.AWS_REGION || 'us-east-1',
}));

export const cognitoConfig = registerAs('cognito', () => ({
  userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
  clientId: process.env.AWS_COGNITO_CLIENT_ID,
}));

export const s3Config = registerAs('s3', () => ({
  bucketName: process.env.AWS_S3_BUCKET_NAME,
  uploadUrlExpiresIn: parseInt(
    process.env.AWS_S3_UPLOAD_URL_EXPIRES_IN || '900',
    10,
  ),
  downloadUrlExpiresIn: parseInt(
    process.env.AWS_S3_DOWNLOAD_URL_EXPIRES_IN || '3600',
    10,
  ),
}));

export const dynamoConfig = registerAs('dynamo', () => ({
  tableName: process.env.AWS_DYNAMODB_TABLE_NAME,
}));
