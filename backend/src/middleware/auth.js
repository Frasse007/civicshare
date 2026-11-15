import { verifyToken, COOKIE_NAME } from '../utils/tokens.js';
import { AppError } from '../utils/AppError.js';

function readToken(req) {
  if (req.cookies?.[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const header = req.get('authorization');
  return header?.startsWith('Bearer ') ? header.slice(7) : null;
}

// Requires a valid JWT (cookie first, Bearer header for API clients). Sets req.auth.
export function authenticate(req, _res, next) {
  const payload = verifyToken(readToken(req));
  if (!payload) return next(AppError.unauthorized());
  req.auth = { userId: Number(payload.sub), role: payload.role };
  return next();
}

// Role-based access control. Deny by default: anything not explicitly allowed gets 403.
export function requireRole(...allowed) {
  return (req, _res, next) => {
    if (!req.auth || !allowed.includes(req.auth.role)) return next(AppError.forbidden());
    return next();
  };
}
