import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../../src/validators/auth.validators.js';
import { listToolsQuery, createToolSchema } from '../../src/validators/tool.validators.js';

describe('registerSchema', () => {
  const ok = { name: 'Ada Lovelace', email: ' ADA@Example.com ', password: 'analytic1' };

  it('normalises email and trims name', () => {
    const r = registerSchema.parse({ ...ok, name: '  Ada  ' });
    expect(r.email).toBe('ada@example.com');
    expect(r.name).toBe('Ada');
  });
  it('drops unknown keys such as role (no privilege escalation)', () => {
    expect(registerSchema.parse({ ...ok, role: 'admin' })).not.toHaveProperty('role');
  });
  it.each([
    ['short password', { password: 'a1' }],
    ['password without a number', { password: 'onlyletters' }],
    ['password without a letter', { password: '12345678' }],
    ['password over bcrypt limit', { password: 'a1'.repeat(40) }],
    ['invalid email', { email: 'nope' }],
    ['one-letter name', { name: 'A' }],
  ])('rejects %s', (_label, patch) => {
    expect(registerSchema.safeParse({ ...ok, ...patch }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('requires a password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
  });
});

describe('listToolsQuery', () => {
  it('applies defaults', () => {
    expect(listToolsQuery.parse({})).toMatchObject({ sort: 'name', page: 1, pageSize: 12 });
  });
  it('treats empty strings as unset and coerces numbers', () => {
    const q = listToolsQuery.parse({ category: '', minSafety: '4', page: '2' });
    expect(q.category).toBeUndefined();
    expect(q.minSafety).toBe(4);
    expect(q.page).toBe(2);
  });
  it('rejects out-of-range or unknown values', () => {
    expect(listToolsQuery.safeParse({ minSafety: '9' }).success).toBe(false);
    expect(listToolsQuery.safeParse({ category: 'Weapons' }).success).toBe(false);
    expect(listToolsQuery.safeParse({ pageSize: '500' }).success).toBe(false);
  });
});

describe('createToolSchema', () => {
  const tool = { name: 'Drill', description: 'A cordless drill for home use', category: 'Power Tools', pickupStation: 'Shed', latitude: 41.9, longitude: -87.6 };
  it('fills defaults', () => {
    expect(createToolSchema.parse(tool)).toMatchObject({ condition: 'Good', safetyRating: 3, safetyGear: [] });
  });
  it('rejects impossible coordinates', () => {
    expect(createToolSchema.safeParse({ ...tool, latitude: 120 }).success).toBe(false);
  });
});
