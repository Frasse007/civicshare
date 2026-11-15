import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, freshDatabase, closeDatabase, loginAs } from '../helpers.js';

beforeAll(freshDatabase);
afterAll(closeDatabase);

describe('GET /api/tools (public catalog)', () => {
  it('lists seeded tools with pagination metadata and filter options', async () => {
    const res = await request(app).get('/api/tools?pageSize=5').expect(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.meta).toMatchObject({ total: 12, page: 1, pageSize: 5, totalPages: 3 });
    expect(res.body.filters.categories).toContain('Ladders');
  });

  it('filters by category', async () => {
    const res = await request(app).get('/api/tools?category=Ladders');
    expect(res.body.data.map((t) => t.category)).toEqual(['Ladders', 'Ladders']);
  });

  it('filters by availability status', async () => {
    const res = await request(app).get('/api/tools?status=maintenance');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toMatch(/Tile Wet Saw/);
  });

  it('filters by minimum safety rating', async () => {
    const res = await request(app).get('/api/tools?minSafety=5');
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((t) => t.safetyRating === 5)).toBe(true);
  });

  it('combines filters (AND)', async () => {
    const res = await request(app).get('/api/tools?category=Lawn%20%26%20Garden&condition=Good&status=available');
    expect(res.body.data.map((t) => t.name).sort()).toEqual(['Core Lawn Aerator', 'Electric Hedge Trimmer']);
  });

  it('searches name and description case-insensitively', async () => {
    const byName = await request(app).get('/api/tools?search=PRESSURE');
    expect(byName.body.data[0].name).toMatch(/Pressure Washer/);
    const byDescription = await request(app).get('/api/tools?search=porcelain');
    expect(byDescription.body.data[0].name).toMatch(/Tile Wet Saw/);
  });

  it('treats % in search text literally and returns an empty page (not an error)', async () => {
    const res = await request(app).get('/api/tools?search=%25').expect(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it('is safe against SQL-injection-style search text', async () => {
    await request(app).get(`/api/tools?search=${encodeURIComponent("'; DROP TABLE tools; --")}`).expect(200);
    const res = await request(app).get('/api/tools').expect(200);
    expect(res.body.meta.total).toBe(12);
  });

  it('sorts by safety rating descending', async () => {
    const res = await request(app).get('/api/tools?sort=safety');
    const ratings = res.body.data.map((t) => t.safetyRating);
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
  });

  it('rejects invalid filter values with 400', async () => {
    await request(app).get('/api/tools?category=Weapons').expect(400);
    await request(app).get('/api/tools?minSafety=9').expect(400);
  });

  it('serves responses well under the 1 second performance target', async () => {
    const start = performance.now();
    await request(app).get('/api/tools?category=Cleaning&minSafety=3').expect(200);
    expect(performance.now() - start).toBeLessThan(1000);
  });
});

describe('GET /api/tools/:id', () => {
  it('returns safety documentation for a tool', async () => {
    const list = await request(app).get('/api/tools?search=miter');
    const id = list.body.data[0].id;
    const res = await request(app).get(`/api/tools/${id}`).expect(200);
    expect(res.body.data.safetyGuidelines.length).toBeGreaterThan(0);
    expect(res.body.data.safetyGear).toContain('Safety glasses');
  });
  it('404s for a missing tool and 400s for a malformed id', async () => {
    await request(app).get('/api/tools/99999').expect(404);
    await request(app).get('/api/tools/abc').expect(400);
  });
});

describe('role-based access control on admin endpoints', () => {
  const payload = { name: 'Post Hole Digger', description: 'Two-person auger for fence posts', category: 'Lawn & Garden', pickupStation: 'Maple Street Garage', latitude: 41.88, longitude: -87.62 };

  it('anonymous users get 401', async () => {
    await request(app).post('/api/tools').send(payload).expect(401);
    await request(app).patch('/api/tools/1/status').send({ status: 'maintenance' }).expect(401);
  });

  it('members get 403 and the tool is unchanged', async () => {
    const member = await loginAs('member');
    await member.post('/api/tools').send(payload).expect(403);
    await member.patch('/api/tools/1/status').send({ status: 'maintenance' }).expect(403);
    const res = await request(app).get('/api/tools/1');
    expect(res.body.data.status).toBe('available');
  });

  it('admins can create tools (defaults applied, HTML stripped)', async () => {
    const admin = await loginAs('admin');
    const res = await admin.post('/api/tools').send({ ...payload, name: '<b>Post Hole Digger</b>' }).expect(201);
    expect(res.body.data).toMatchObject({ name: 'Post Hole Digger', condition: 'Good', status: 'available', safetyRating: 3 });
  });

  it('admins can mark a tool Under Maintenance and back', async () => {
    const admin = await loginAs('admin');
    const down = await admin.patch('/api/tools/1/status').send({ status: 'maintenance' }).expect(200);
    expect(down.body.data.status).toBe('maintenance');
    const listed = await request(app).get('/api/tools?status=maintenance');
    expect(listed.body.data.map((t) => t.id)).toContain(1);
    await admin.patch('/api/tools/1/status').send({ status: 'available' }).expect(200);
  });

  it('validates admin input (400) and unknown tool (404)', async () => {
    const admin = await loginAs('admin');
    await admin.patch('/api/tools/1/status').send({ status: 'exploded' }).expect(400);
    await admin.patch('/api/tools/99999/status').send({ status: 'available' }).expect(404);
    await admin.post('/api/tools').send({ ...payload, latitude: 999 }).expect(400);
  });
});
