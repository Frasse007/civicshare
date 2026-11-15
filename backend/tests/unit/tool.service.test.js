import { describe, it, expect } from 'vitest';
import { Op } from 'sequelize';
import { buildToolWhere, escapeLike } from '../../src/services/tool.service.js';

describe('escapeLike', () => {
  it('escapes %, _ and backslash', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\');
  });
});

describe('buildToolWhere', () => {
  it('returns an empty filter when nothing is selected', () => {
    expect(buildToolWhere({})).toEqual({});
    expect(buildToolWhere()).toEqual({});
  });
  it('maps each filter to a column condition', () => {
    const where = buildToolWhere({ category: 'Ladders', condition: 'Good', status: 'available', minSafety: 4 });
    expect(where).toMatchObject({ category: 'Ladders', condition: 'Good', status: 'available' });
    expect(where.safetyRating[Op.gte]).toBe(4);
  });
  it('searches name and description case-insensitively with escaped wildcards', () => {
    const where = buildToolWhere({ search: '10%' });
    expect(where[Op.or]).toHaveLength(2);
    expect(where[Op.or][0].name[Op.iLike]).toBe('%10\\%%');
  });
});
