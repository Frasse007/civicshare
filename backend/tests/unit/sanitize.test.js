import { describe, it, expect } from 'vitest';
import { sanitizeString, sanitizeDeep } from '../../src/middleware/sanitize.js';

describe('sanitizeString', () => {
  it('strips HTML tags', () => {
    expect(sanitizeString('<script>alert(1)</script>Hello <b>you</b>')).toBe('alert(1)Hello you');
  });
  it('removes control characters but keeps normal whitespace', () => {
    expect(sanitizeString('a\u0000b\u0007c\td\ne')).toBe('abc\td\ne');
  });
});

describe('sanitizeDeep', () => {
  it('cleans nested objects and arrays', () => {
    expect(sanitizeDeep({ a: ['<i>x</i>'], b: { c: '<u>y</u>' }, n: 5 })).toEqual({ a: ['x'], b: { c: 'y' }, n: 5 });
  });
  it('never alters passwords', () => {
    expect(sanitizeDeep({ password: 'p<a>ss' }).password).toBe('p<a>ss');
  });
});
