import { z } from 'zod';
import { paginationQuerySchema } from '@atyantik/shared-types';

export const idParamSchema = z.object({
  id: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

export const roleCreateSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'slug must contain only lowercase letters, numbers and hyphens'),
  description: z.string().optional().nullable(),
});
export const roleUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});
export const roleQuerySchema = paginationQuerySchema;

export type RoleCreateInput = z.infer<typeof roleCreateSchema>;
export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;
export type RoleQuery = z.infer<typeof roleQuerySchema>;

export const setRolePermissionsSchema = z.object({
  permissionIds: z.array(z.string().min(1)).default([]),
});
export type SetRolePermissionsInput = z.infer<typeof setRolePermissionsSchema>;

// ---------------------------------------------------------------------------
// Permission (read-only)
// ---------------------------------------------------------------------------

export const permissionQuerySchema = paginationQuerySchema.extend({
  module: z.string().min(1).optional(),
});
export type PermissionQuery = z.infer<typeof permissionQuerySchema>;
