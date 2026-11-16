/**
 * Application factory (Factory pattern).
 * `createApp()` builds an Express app with no side effects (no listen, no DB sync),
 * which lets integration tests mount the real middleware stack with supertest.
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { sanitizeBody } from './middleware/sanitize.js';
import healthRoutes from './routes/health.routes.js';
import { createAuthRouter } from './routes/auth.routes.js';
import toolRoutes from './routes/tool.routes.js';

export function createApp({ corsOrigins = env.corsOrigins, authRateLimitMax = 20 } = {}) {
  const app = express();
  app.disable('x-powered-by');
  // Render/Vercel sit behind a proxy, needed for secure cookies and accurate rate-limit IPs.
  app.set('trust proxy', 1);

  app.use(helmet());
  // Strict CORS: only allow-listed origins, credentials enabled for the HTTP-only cookie.
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || corsOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
    }),
  );
  if (env.NODE_ENV !== 'test') app.use(morgan('tiny'));
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  app.use(sanitizeBody);

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', createAuthRouter({ rateLimitMax: authRateLimitMax }));
  app.use('/api/tools', toolRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

// Export the default app instance required by Vercel's serverless runtime
export default createApp();