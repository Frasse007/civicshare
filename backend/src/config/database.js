import { Sequelize } from 'sequelize';
import { env } from './env.js';

// Use the pooled URL if available, otherwise fall back to direct DATABASE_URL
const connectionString = env.DATABASE_URL_POOLED || env.DATABASE_URL;

export const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: false,
  // Connection pooling optimized for serverless environments
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
});