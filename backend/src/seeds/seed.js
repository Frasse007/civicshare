import bcrypt from 'bcryptjs';
import { User, Tool, sequelize } from '../models/index.js';
import { toolSeed } from './tools.js';

// Demo accounts for showcasing currently. REPLACE/REMOVE before any real use.
export const demoUsers = [
  { name: 'Ada Admin', email: 'admin@civicshare.dev', password: 'Admin123!', role: 'admin' },
  { name: 'Maya Member', email: 'member@civicshare.dev', password: 'Member123!', role: 'member' },
];

// Idempotent: inserts demo data only for tables that are empty.
export async function seedDatabase() {
  const created = { users: 0, tools: 0 };
  if ((await User.count()) === 0) {
    const rows = await Promise.all(
      demoUsers.map(async ({ password, ...u }) => ({ ...u, passwordHash: await bcrypt.hash(password, 10) })),
    );
    await User.bulkCreate(rows);
    created.users = rows.length;
  }
  if ((await Tool.count()) === 0) {
    await Tool.bulkCreate(toolSeed);
    created.tools = toolSeed.length;
  }
  return created;
}

export async function resetAndSeed() {
  await sequelize.sync({ force: true });
  return seedDatabase();
}
