// Catalog business logic: multi-parameter search, lookup and admin mutations.
import { Op } from 'sequelize';
import { Tool, CATEGORIES, CONDITIONS, STATUSES } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

const SORTS = {
  name: [['name', 'ASC']],
  safety: [['safetyRating', 'DESC'], ['name', 'ASC']],
  newest: [['createdAt', 'DESC']],
};

// Escapes LIKE wildcards so a user typing "50%" searches for the literal text.
export function escapeLike(term) {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}

// Builds the Sequelize WHERE clause from validated filters.
export function buildToolWhere({ search, category, condition, status, minSafety } = {}) {
  const where = {};
  if (category) where.category = category;
  if (condition) where.condition = condition;
  if (status) where.status = status;
  if (minSafety) where.safetyRating = { [Op.gte]: minSafety };
  if (search) {
    const pattern = `%${escapeLike(search)}%`;
    where[Op.or] = [{ name: { [Op.iLike]: pattern } }, { description: { [Op.iLike]: pattern } }];
  }
  return where;
}

export async function listTools(query) {
  const { sort, page, pageSize } = query;
  const { rows, count } = await Tool.findAndCountAll({
    where: buildToolWhere(query),
    order: SORTS[sort],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  return {
    data: rows,
    meta: { total: count, page, pageSize, totalPages: Math.max(1, Math.ceil(count / pageSize)) },
    filters: { categories: CATEGORIES, conditions: CONDITIONS, statuses: STATUSES },
  };
}

export async function getTool(id) {
  const tool = await Tool.findByPk(id);
  if (!tool) throw AppError.notFound('Tool not found');
  return tool;
}

export function createTool(attrs) {
  return Tool.create(attrs);
}

// Admin-only (enforced in the route). TODO: make status of "maintenance" block new reservations.
export async function updateToolStatus(id, status) {
  const tool = await getTool(id);
  tool.status = status;
  await tool.save();
  return tool;
}