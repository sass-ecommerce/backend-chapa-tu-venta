import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/mydb',
  },

  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    username: process.env.POSTGRES_USER || 'user',
    password: process.env.POSTGRES_PASSWORD || 'password',
    database: process.env.POSTGRES_DB || 'mydb',
    schema: process.env.POSTGRES_SCHEMA || 'mydb',
  },
}));

export const authConfig = registerAs('auth', () => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    accessTokenExpiration: process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m',
    refreshTokenExpirationDays: parseInt(
      process.env.JWT_REFRESH_TOKEN_EXPIRATION_DAYS || '7',
      10,
    ),
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  },
}));
