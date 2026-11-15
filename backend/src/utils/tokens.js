import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const COOKIE_NAME = 'civicshare_token';

// Signs a short-lived JWT carrying only the user id and role (no PII).
export function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: `${env.JWT_EXPIRES_HOURS}h`,
  });
}

// Returns the payload or null. Pins the algorithm to prevent "alg: none" downgrade.
export function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
}

/**
 * HTTP-only cookie options. Because the cookie is unreadable from JavaScript, an XSS bug cannot exfiltrate the session token. 
 * SameSite=None + Secure is only needed when the SPA and API are on different sites.
 */
export function cookieOptions() {
  const sameSite = env.COOKIE_SAMESITE;
  return {
    httpOnly: true,
    secure: env.isProd || sameSite === 'none',
    sameSite,
    maxAge: env.JWT_EXPIRES_HOURS * 60 * 60 * 1000,
    path: '/',
  };
}
