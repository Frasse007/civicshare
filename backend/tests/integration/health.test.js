import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app, closeDatabase } from '../helpers.js';

afterAll(closeDatabase);

describe('GET /api/health', () => {
  it('reports the API and database as up', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
  });
  it('returns JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist').expect(404);
    expect(res.body.error.message).toMatch(/not found/i);
  });
  it('sets security headers and hides x-powered-by', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
  it('only reflects CORS for allow-listed origins', async () => {
    const good = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(good.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(good.headers['access-control-allow-credentials']).toBe('true');
    const bad = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(bad.headers['access-control-allow-origin']).toBeUndefined();
  });
  it('rejects malformed JSON with 400', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
  });
});
