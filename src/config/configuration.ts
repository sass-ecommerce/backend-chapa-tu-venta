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
