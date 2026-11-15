import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { ROLES } from '../models/index.js';
import { listToolsQuery, toolIdParams, createToolSchema, updateStatusSchema } from '../validators/tool.validators.js';
import * as ctrl from '../controllers/tool.controller.js';

const router = Router();
const adminOnly = [authenticate, requireRole(ROLES.ADMIN)];

// Public catalog (browse + search)
router.get('/', validate(listToolsQuery, 'query'), ctrl.list);
router.get('/:id', validate(toolIdParams, 'params'), ctrl.get);

// Inventory-manager actions: deny-by-default RBAC
router.post('/', ...adminOnly, validate(createToolSchema), ctrl.create);
router.patch('/:id/status', ...adminOnly, validate(toolIdParams, 'params'), validate(updateStatusSchema), ctrl.updateStatus);

export default router;