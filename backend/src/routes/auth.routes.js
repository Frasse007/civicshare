import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { registerSchema, loginSchema } from '../validators/auth.validators.js';
import * as ctrl from '../controllers/auth.controller.js';

export function createAuthRouter({ rateLimitMax = 20 } = {}) {
  const router = Router();
  // Brute-force protection for credential endpoints.
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: rateLimitMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { message: 'Too many attempts. Please try again later.' } },
  });

  router.post('/register', limiter, validate(registerSchema), ctrl.register);
  router.post('/login', limiter, validate(loginSchema), ctrl.login);
  router.post('/logout', ctrl.logout);
  router.get('/me', authenticate, ctrl.me);
  return router;
}
