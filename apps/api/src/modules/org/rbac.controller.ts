import type { Request, Response } from 'express';
import { sendCreated, sendPaginated, sendSuccess } from '../../lib/response.js';
import * as rbacService from './rbac.service.js';
import type { PermissionQuery, RoleCreateInput, RoleQuery, RoleUpdateInput, SetRolePermissionsInput } from './rbac.validation.js';

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

export async function listRolesHandler(req: Request, res: Response) {
  const query = req.query as unknown as RoleQuery;
  const result = await rbacService.listRoles(query);
  return sendPaginated(res, result);
}

export async function getRoleHandler(req: Request, res: Response) {
  const role = await rbacService.getRole((req.params.id as string));
  return sendSuccess(res, role);
}

export async function createRoleHandler(req: Request, res: Response) {
  const body = req.body as RoleCreateInput;
  const role = await rbacService.createRole(body);
  return sendCreated(res, role);
}

export async function updateRoleHandler(req: Request, res: Response) {
  const body = req.body as RoleUpdateInput;
  const role = await rbacService.updateRole((req.params.id as string), body);
  return sendSuccess(res, role, 'Role updated successfully');
}

export async function deleteRoleHandler(req: Request, res: Response) {
  await rbacService.deleteRole((req.params.id as string));
  return sendSuccess(res, null, 'Role deleted successfully');
}

export async function setRolePermissionsHandler(req: Request, res: Response) {
  const body = req.body as SetRolePermissionsInput;
  const role = await rbacService.setRolePermissions((req.params.id as string), body);
  return sendSuccess(res, role, 'Role permissions updated successfully');
}

// ---------------------------------------------------------------------------
// Permission (read-only)
// ---------------------------------------------------------------------------

export async function listPermissionsHandler(req: Request, res: Response) {
  const query = req.query as unknown as PermissionQuery;
  const result = await rbacService.listPermissions(query);
  return sendPaginated(res, result);
}
