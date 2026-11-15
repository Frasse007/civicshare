import { Router } from 'express';
import { sequelize } from '../config/database.js';

const router = Router();

/** Health check used by Vercel and uptime monitors, verifies the DB is reachable. */
router.get('/', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', database: 'up', uptime: Math.round(process.uptime()) });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'down' });
  }
});

export default router;
