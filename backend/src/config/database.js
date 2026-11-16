import { Sequelize } from 'sequelize';
import pg from 'pg';
import { env } from './env.js';

const connectionString = 
  env?.DATABASE_URL || 
  process.env.DATABASE_URL || 
  process.env.DATABASE_URL_POOLED || 
  process.env.DATABASE_URL_UNPOOLED;

if (!connectionString || typeof connectionString !== 'string') {
  throw new Error(`CRITICAL DATABASE ERROR: Connection string is missing or invalid! Received: ${connectionString}`);
}

// Automatically detect if running locally vs production (Neon)
const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

export const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  dialectModule: pg,
  logging: false,
  // Connection pooling optimized for serverless environments
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  dialectOptions: isLocal ? {} : {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
});