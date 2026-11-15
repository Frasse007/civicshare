import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, freshDatabase, closeDatabase } from '../helpers.js';
import { User } from '../../src/models/index.js';

beforeAll(freshDatabase);
afterAll(closeDatabase);

const newUser = { name: 'Grace Hopper', email: 'grace@example.com', password: 'compiler1' };

describe('POST /api/auth/register', () => {
  it('creates a member, returns a JWT and sets an HTTP-only cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(newUser).expect(201);
    expect(res.body.user).toMatchObject({ name: 'Grace Hopper', email: 'grace@example.com', role: 'member' });
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.headers['set-cookie'][0]).toMatch(/civicshare_token=.*HttpOnly/);
  });

  it('stores a bcrypt hash, never the plaintext password', async () => {
    const stored = await User.findOne({ where: { email: 'grace@example.com' } });
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored.passwordHash).not.toContain('compiler1');
  });

  it('rejects a duplicate email (case-insensitive) with 409', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...newUser, email: 'GRACE@example.com' });
    expect(res.status).toBe(409);
  });

  it('ignores a client-supplied role (cannot self-register as admin)', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Mallory', email: 'm@example.com', password: 'hacker123', role: 'admin' }).expect(201);
    expect(res.body.user.role).toBe('member');
  });

  it('strips HTML from the name', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: '<img src=x onerror=1>Bob', email: 'bob@example.com', password: 'builder123' }).expect(201);
    expect(res.body.user.name).toBe('Bob');
  });

  it('returns field-level validation errors', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: '', email: 'bad', password: '1' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field)).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: newUser.email, password: newUser.password }).expect(200);
    expect(res.body.user.email).toBe(newUser.email);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('gives the same generic 401 for a wrong password and an unknown email', async () => {
    const wrong = await request(app).post('/api/auth/login').send({ email: newUser.email, password: 'nope12345' });
    const unknown = await request(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: 'nope12345' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
  });

  it('requires both fields', async () => {
    await request(app).post('/api/auth/login').send({ email: newUser.email }).expect(400);
  });
});

describe('session endpoints', () => {
  it('GET /me returns the current user for a cookie session', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: newUser.email, password: newUser.password });
    const res = await agent.get('/api/auth/me').expect(200);
    expect(res.body.user.email).toBe(newUser.email);
  });

  it('GET /me accepts a Bearer token', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: newUser.email, password: newUser.password });
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`).expect(200);
  });

  it('GET /me is 401 without a session', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });

  it('GET /me is 401 for a tampered token', async () => {
    await request(app).get('/api/auth/me').set('Authorization', 'Bearer abc.def.ghi').expect(401);
  });

  it('logout clears the cookie', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: newUser.email, password: newUser.password });
    const out = await agent.post('/api/auth/logout').expect(204);
    expect(out.headers['set-cookie'][0]).toMatch(/civicshare_token=;/);
    await agent.get('/api/auth/me').expect(401);
  });
});
