/** Process entry point: connect to Postgres, sync schema, optionally seed, then listen. */
import { env } from './config/env.js';
import { sequelize } from './models/index.js';
import { seedDatabase } from './seeds/seed.js';
import { createApp } from './app.js';

async function main() {
  await sequelize.authenticate();
  if (env.DB_SYNC) await sequelize.sync();
  if (env.SEED_ON_BOOT) console.log('Seed:', await seedDatabase());

  const app = createApp();
  app.listen(env.PORT, () => console.log(`CivicShare API listening on :${env.PORT} (${env.NODE_ENV})`));
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
