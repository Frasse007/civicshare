import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { signToken, verifyToken, cookieOptions } from '../../src/utils/tokens.js';

describe('JWT helpers', () => {
  const user = { id: 7, role: 'admin' };

  it('round-trips subject and role', () => {
    const payload = verifyToken(signToken(user));
    expect(payload).toMatchObject({ sub: '7', role: 'admin' });
  });

  it('rejects garbage and missing tokens', () => {
    expect(verifyToken('not-a-token')).toBeNull();
    expect(verifyToken(undefined)).toBeNull();
  });

  it('rejects tokens signed with a different secret', () => {
    expect(verifyToken(jwt.sign({ sub: '1', role: 'admin' }, 'another-secret-another-secret'))).toBeNull();
  });

  it('rejects unsigned "alg: none" tokens', () => {
    const none = jwt.sign({ sub: '1', role: 'admin' }, '', { algorithm: 'none' });
    expect(verifyToken(none)).toBeNull();
  });

  it('rejects expired tokens', () => {
    const expired = jwt.sign({ sub: '1', role: 'member' }, process.env.JWT_SECRET, { expiresIn: -10 });
    expect(verifyToken(expired)).toBeNull();
  });

  it('issues HTTP-only cookies', () => {
    expect(cookieOptions()).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/' });
  });
});
