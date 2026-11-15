import { describe, it, expect } from 'vitest';
import { validateLogin, validateRegister } from '../utils/validation.js';
import { buildSafetySheet, safetySheetFilename } from '../utils/safetySheet.js';
import { statusMeta } from '../utils/format.js';
import { buildToolsQuery } from '../api/toolsApi.js';
import { makeTool } from '../test/fixtures.js';

describe('validateLogin', () => {
  it('accepts valid credentials', () => expect(validateLogin({ email: 'a@b.co', password: 'x' })).toEqual({}));
  it('flags a bad email and empty password', () => {
    expect(validateLogin({ email: 'nope', password: '' })).toEqual({ email: expect.any(String), password: expect.any(String) });
  });
});

describe('validateRegister', () => {
  const ok = { name: 'Ada', email: 'a@b.co', password: 'abcdef12' };
  it('accepts a valid form', () => expect(validateRegister(ok)).toEqual({}));
  it.each([
    [{ name: ' A ' }, 'name'],
    [{ email: 'a@b' }, 'email'],
    [{ password: 'a1' }, 'password'],
    [{ password: '12345678' }, 'password'],
    [{ password: 'abcdefgh' }, 'password'],
  ])('rejects %j', (patch, field) => expect(validateRegister({ ...ok, ...patch })).toHaveProperty(field));
});

describe('safety sheet', () => {
  it('lists gear as a checklist and guidelines as numbered steps', () => {
    const sheet = buildSafetySheet(makeTool());
    expect(sheet).toContain('[ ] Gloves');
    expect(sheet).toContain('1. Keep three points of contact.');
    expect(sheet).toContain('Safety rating: 4/5');
  });
  it('handles tools with no gear or guidelines', () => {
    const sheet = buildSafetySheet(makeTool({ safetyGear: [], safetyGuidelines: [] }));
    expect(sheet).toContain('(none required)');
    expect(sheet).toContain('(none listed)');
  });
  it('creates a safe filename', () => {
    expect(safetySheetFilename(makeTool({ name: '10" Miter Saw / Pro!' }))).toBe('10-miter-saw-pro-safety-sheet.txt');
  });
});

describe('statusMeta', () => {
  it('maps known statuses and tolerates unknown ones', () => {
    expect(statusMeta('maintenance')).toEqual({ label: 'Under maintenance', tone: 'bad' });
    expect(statusMeta('weird').label).toBe('weird');
  });
});

describe('buildToolsQuery', () => {
  it('skips empty filters', () => {
    expect(buildToolsQuery({ search: '', category: 'Ladders', page: 2, minSafety: '' })).toBe('?category=Ladders&page=2');
  });
  it('returns an empty string when nothing is set', () => expect(buildToolsQuery({ search: '' })).toBe(''));
  it('encodes special characters', () => expect(buildToolsQuery({ category: 'Lawn & Garden' })).toBe('?category=Lawn+%26+Garden'));
});
