// HTTP adapter for auth: translates req/res to service calls.
import { registerUser, loginUser, getUserById } from '../services/auth.service.js';
import { COOKIE_NAME, cookieOptions } from '../utils/tokens.js';
import { env } from '../config/env.js';

function sendSession(res, status, { user, token }) {
  res.cookie(COOKIE_NAME, token, cookieOptions());
  // `token` is included for non-browser API clients; the SPA ignores it and relies on the cookie.
  res.status(status).json({ user, token, expiresInHours: env.JWT_EXPIRES_HOURS });
}

export async function register(req, res) {
  sendSession(res, 201, await registerUser(req.validated.body));
}

export async function login(req, res) {
  sendSession(res, 200, await loginUser(req.validated.body));
}

export function logout(_req, res) {
  const { httpOnly, secure, sameSite, path } = cookieOptions();
  res.clearCookie(COOKIE_NAME, { httpOnly, secure, sameSite, path });
  res.status(204).end();
}

export async function me(req, res) {
  res.json({ user: await getUserById(req.auth.userId) });
}
