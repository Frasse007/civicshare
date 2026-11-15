// CLI: `npm run seed` creates tables (if needed) and inserts demo data if empty.s
import { sequelize } from '../models/index.js';
import { seedDatabase } from './seed.js';

try {
  await sequelize.sync();
  console.log('Seeded:', await seedDatabase());
} catch (err) {
  console.error('Seed failed:', err);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
