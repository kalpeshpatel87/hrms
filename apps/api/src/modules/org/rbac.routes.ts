import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './rbac.controller.js';
import {
  idParamSchema,
  permissionQuerySchema,
  roleCreateSchema,
  roleQuerySchema,
  roleUpdateSchema,
  setRolePermissionsSchema,
} from './rbac.validation.js';

/** Role + Permission (RBAC) sub-router, nested under orgRoutes (see org.routes.ts). */
export const rbacRoutes = Router();

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

rbacRoutes.get(
  '/roles',
  ...requireAuth('role:read'),
  validate(roleQuerySchema, 'query'),
  asyncHandler(controller.listRolesHandler),
);

rbacRoutes.get(
  '/roles/:id',
  ...requireAuth('role:read'),
  validate(idParamSchema, 'params'),
  asyncHandler(controller.getRoleHandler),
);

rbacRoutes.post(
  '/roles',
  ...requireAuth('role:create'),
  validate(roleCreateSchema),
  asyncHandler(controller.createRoleHandler),
);

rbacRoutes.put(
  '/roles/:id',
  ...requireAuth('role:update'),
  validate(idParamSchema, 'params'),
  validate(roleUpdateSchema),
  asyncHandler(controller.updateRoleHandler),
);

rbacRoutes.delete(
  '/roles/:id',
  ...requireAuth('role:delete'),
  validate(idParamSchema, 'params'),
  asyncHandler(controller.deleteRoleHandler),
);

/** Replaces a role's full permission list transactionally. Blocked for system roles (403). */
rbacRoutes.put(
  '/roles/:id/permissions',
  ...requireAuth('role:update'),
  validate(idParamSchema, 'params'),
  validate(setRolePermissionsSchema),
  asyncHandler(controller.setRolePermissionsHandler),
);

// ---------------------------------------------------------------------------
// Permission (read-only)
// ---------------------------------------------------------------------------

rbacRoutes.get(
  '/permissions',
  ...requireAuth('permission:read'),
  validate(permissionQuerySchema, 'query'),
  asyncHandler(controller.listPermissionsHandler),
);
