import { z } from 'zod';
import { CATEGORIES, CONDITIONS, STATUSES } from '../models/index.js';

// Query-string filters for GET /api/tools. Empty strings are treated as "not set".
const emptyToUndefined = (schema) => z.preprocess((v) => (v === '' ? undefined : v), schema.optional());

export const listToolsQuery = z.object({
  search: emptyToUndefined(z.string().trim().max(80)),
  category: emptyToUndefined(z.enum(CATEGORIES)),
  condition: emptyToUndefined(z.enum(CONDITIONS)),
  status: emptyToUndefined(z.enum(STATUSES)),
  minSafety: emptyToUndefined(z.coerce.number().int().min(1).max(5)),
  sort: z.enum(['name', 'safety', 'newest']).default('name'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const toolIdParams = z.object({ id: z.coerce.number().int().positive() });

const stringList = z.array(z.string().trim().min(1).max(200)).max(20);

export const createToolSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(2000),
  category: z.enum(CATEGORIES),
  condition: z.enum(CONDITIONS).default('Good'),
  safetyRating: z.number().int().min(1).max(5).default(3),
  emoji: z.string().trim().min(1).max(8).default('🔧'),
  pickupStation: z.string().trim().min(2).max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  safetyGuidelines: stringList.default([]),
  safetyGear: stringList.default([]),
  weatherSensitive: z.boolean().default(false),
});

export const updateStatusSchema = z.object({ status: z.enum(STATUSES) });
