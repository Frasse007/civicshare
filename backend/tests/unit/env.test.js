import { describe, it, expect } from 'vitest';
import { loadEnv } from '../../src/config/env.js';

const valid = { DATABASE_URL: 'postgres://x', JWT_SECRET: 'a'.repeat(20) };

describe('loadEnv', () => {
  it('applies safe defaults', () => {
    const cfg = loadEnv(valid);
    expect(cfg.PORT).toBe(4000);
    expect(cfg.COOKIE_SAMESITE).toBe('lax');
    expect(cfg.DB_SYNC).toBe(true);
    expect(cfg.isProd).toBe(false);
  });

  it('splits CORS origins into a trimmed allow-list', () => {
    const cfg = loadEnv({ ...valid, CORS_ORIGINS: 'https://a.com, https://b.com ,' });
    expect(cfg.corsOrigins).toEqual(['https://a.com', 'https://b.com']);
  });

  it('fails fast with a readable message when required values are missing', () => {
    expect(() => loadEnv({})).toThrow(/DATABASE_URL/);
  });

  it('rejects a weak JWT secret', () => {
    expect(() => loadEnv({ ...valid, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });
});
