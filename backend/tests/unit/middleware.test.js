import { describe, it, expect, vi } from 'vitest';
import { authenticate, requireRole } from '../../src/middleware/auth.js';
import { validate } from '../../src/middleware/validate.js';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler.js';
import { AppError } from '../../src/utils/AppError.js';
import { signToken, COOKIE_NAME } from '../../src/utils/tokens.js';
import { z } from 'zod';

const run = (mw, req) => {
  const next = vi.fn();
  mw(req, {}, next);
  return next;
};

describe('authenticate', () => {
  it('rejects requests without a token (401)', () => {
    const next = run(authenticate, { cookies: {}, get: () => undefined });
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401 });
  });
  it('accepts a valid cookie and exposes req.auth', () => {
    const req = { cookies: { [COOKIE_NAME]: signToken({ id: 3, role: 'member' }) }, get: () => undefined };
    const next = run(authenticate, req);
    expect(next).toHaveBeenCalledWith();
    expect(req.auth).toEqual({ userId: 3, role: 'member' });
  });
  it('accepts a Bearer token for API clients', () => {
    const token = signToken({ id: 4, role: 'admin' });
    const req = { cookies: {}, get: (h) => (h === 'authorization' ? `Bearer ${token}` : undefined) };
    run(authenticate, req);
    expect(req.auth).toEqual({ userId: 4, role: 'admin' });
  });
});

describe('requireRole (deny by default)', () => {
  it('allows listed roles', () => {
    expect(run(requireRole('admin'), { auth: { role: 'admin' } })).toHaveBeenCalledWith();
  });
  it('forbids other roles (403)', () => {
    expect(run(requireRole('admin'), { auth: { role: 'member' } }).mock.calls[0][0]).toMatchObject({ status: 403 });
  });
  it('forbids when req.auth is missing', () => {
    expect(run(requireRole('admin'), {}).mock.calls[0][0]).toMatchObject({ status: 403 });
  });
});

describe('validate', () => {
  const mw = validate(z.object({ n: z.coerce.number() }), 'query');
  it('stores parsed data on req.validated', () => {
    const req = { query: { n: '5' } };
    run(mw, req);
    expect(req.validated.query).toEqual({ n: 5 });
  });
  it('returns field-level details on failure', () => {
    const next = run(mw, { query: { n: 'x' } });
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(400);
    expect(err.details[0].field).toBe('n');
  });
});

describe('error handling', () => {
  const res = () => {
    const r = { status: vi.fn(() => r), json: vi.fn(() => r) };
    return r;
  };
  it('renders AppError with its status', () => {
    const r = res();
    errorHandler(AppError.conflict('dup'), {}, r, vi.fn());
    expect(r.status).toHaveBeenCalledWith(409);
    expect(r.json).toHaveBeenCalledWith({ error: { message: 'dup', details: undefined } });
  });
  it('hides internals of unexpected errors', () => {
    const r = res();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    errorHandler(new Error('secret db password leaked'), {}, r, vi.fn());
    expect(r.status).toHaveBeenCalledWith(500);
    expect(JSON.stringify(r.json.mock.calls[0][0])).not.toContain('secret');
    spy.mockRestore();
  });
  it('turns unknown routes into 404', () => {
    const next = vi.fn();
    notFoundHandler({ method: 'GET', originalUrl: '/x' }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 404 });
  });
});
