import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetAndSeed, demoUsers } from '../src/seeds/seed.js';
import { sequelize } from '../src/models/index.js';

export const app = createApp({ authRateLimitMax: 1000 });

export async function freshDatabase() {
  await resetAndSeed();
}

export async function closeDatabase() {
  await sequelize.close();
}

// Logs in as a seeded demo user and returns a supertest agent that keeps the cookie.
export async function loginAs(role) {
  const creds = demoUsers.find((u) => u.role === role);
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email: creds.email, password: creds.password }).expect(200);
  return agent;
}