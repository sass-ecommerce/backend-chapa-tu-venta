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
  },
}));
