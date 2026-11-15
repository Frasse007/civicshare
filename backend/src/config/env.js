/* Central, validated configuration. Every other module imports `env` from here instead of touching process.env. */
import 'dotenv/config';
import { z } from 'zod';

const bool = z.enum(['true', 'false']).default('false').transform((v) => v === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_SSL: bool,
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_HOURS: z.coerce.number().positive().default(2),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  DB_SYNC: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
  SEED_ON_BOOT: bool,
});

export function loadEnv(source = process.env) {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  const cfg = parsed.data;
  return { ...cfg, corsOrigins: cfg.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean), isProd: cfg.NODE_ENV === 'production' };
}

export const env = loadEnv();