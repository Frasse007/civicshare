import { Sequelize } from 'sequelize';
import { env } from './env.js';

/** Sequelize connection */
export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  // Connection pooling mitigates cold-start / connection-exhaustion risk.
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  dialectOptions: env.DATABASE_SSL ? { ssl: { require: true, rejectUnauthorized: false } } : {},
});
