import { prisma, softDelete } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { recordAuditLog } from '../../lib/auditLog.js';
import type { PaginatedResult, PaginationQuery } from '@atyantik/shared-types';
import type {
  PermissionQuery,
  RoleCreateInput,
  RoleQuery,
  RoleUpdateInput,
  SetRolePermissionsInput,
} from './rbac.validation.js';

function buildOrderBy(query: PaginationQuery, allowedFields: string[], fallback: string) {
  const field = query.sortBy && allowedFields.includes(query.sortBy) ? query.sortBy : fallback;
  return { [field]: query.sortDir };
}

function pageSlice(query: PaginationQuery) {
  return { skip: (query.page - 1) * query.pageSize, take: query.pageSize };
}

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

export async function listRoles(query: RoleQuery): Promise<PaginatedResult<unknown>> {
  const where: Record<string, unknown> = {};
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { slug: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.role.findMany({
      where,
      orderBy: buildOrderBy(query, ['name', 'slug', 'createdAt'], 'name'),
      ...pageSlice(query),
      include: { _count: { select: { rolePermissions: true, userRoles: true } } },
    }),
    prisma.role.count({ where }),
  ]);
  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) };
}

export async function getRole(id: string) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { rolePermissions: { include: { permission: true } } },
  });
  if (!role) throw ApiError.notFound('Role not found');
  return role;
}

export async function createRole(input: RoleCreateInput) {
  const clash = await prisma.role.findFirst({ where: { OR: [{ name: input.name }, { slug: input.slug }] } });
  if (clash) throw ApiError.conflict('A role with this name or slug already exists');

  const role = await prisma.role.create({ data: { name: input.name, slug: input.slug, description: input.description ?? undefined } });
  await recordAuditLog({ action: 'CREATE', entityType: 'Role', entityId: role.id, after: role });
  return role;
}

async function assertRoleIsEditable(roleId: string) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw ApiError.notFound('Role not found');
  if (role.isSystem) throw ApiError.forbidden('System roles cannot be modified');
  return role;
}

export async function updateRole(id: string, input: RoleUpdateInput) {
  const before = await assertRoleIsEditable(id);
  if (input.name && input.name !== before.name) {
    const clash = await prisma.role.findFirst({ where: { name: input.name, NOT: { id } } });
    if (clash) throw ApiError.conflict('A role with this name already exists');
  }

  const role = await prisma.role.update({ where: { id }, data: input });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Role', entityId: id, before, after: role });
  return role;
}

export async function deleteRole(id: string) {
  const before = await assertRoleIsEditable(id);
  const assignedCount = await prisma.userRole.count({ where: { roleId: id } });
  if (assignedCount > 0) {
    throw ApiError.conflict('Cannot delete a role that is still assigned to users');
  }

  await softDelete('Role', id);
  await recordAuditLog({ action: 'DELETE', entityType: 'Role', entityId: id, before });
}

/** Replaces a role's full permission list transactionally. Blocked for system roles. */
export async function setRolePermissions(id: string, input: SetRolePermissionsInput) {
  await assertRoleIsEditable(id);

  const uniqueIds = Array.from(new Set(input.permissionIds));
  if (uniqueIds.length > 0) {
    const found = await prisma.permission.findMany({ where: { id: { in: uniqueIds } } });
    if (found.length !== uniqueIds.length) {
      const foundIds = new Set(found.map((p) => p.id));
      const missing = uniqueIds.filter((pid) => !foundIds.has(pid));
      throw ApiError.badRequest(`Unknown permission id(s): ${missing.join(', ')}`);
    }
  }

  const before = await prisma.rolePermission.findMany({ where: { roleId: id }, include: { permission: true } });

  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId: id } });
    if (uniqueIds.length > 0) {
      await tx.rolePermission.createMany({
        data: uniqueIds.map((permissionId) => ({ roleId: id, permissionId })),
      });
    }
  });

  const after = await prisma.rolePermission.findMany({ where: { roleId: id }, include: { permission: true } });
  await recordAuditLog({
    action: 'UPDATE',
    entityType: 'Role',
    entityId: id,
    before: before.map((rp) => rp.permission.key),
    after: after.map((rp) => rp.permission.key),
    metadata: { operation: 'setRolePermissions' },
  });

  return getRole(id);
}

// ---------------------------------------------------------------------------
// Permission (read-only)
// ---------------------------------------------------------------------------

export async function listPermissions(query: PermissionQuery): Promise<PaginatedResult<unknown>> {
  const where: Record<string, unknown> = {};
  if (query.module) where.module = query.module;
  if (query.search) {
    where.OR = [
      { key: { contains: query.search, mode: 'insensitive' } },
      { module: { contains: query.search, mode: 'insensitive' } },
      { action: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.permission.findMany({
      where,
      orderBy: buildOrderBy(query, ['module', 'action', 'key', 'createdAt'], 'module'),
      ...pageSlice(query),
    }),
    prisma.permission.count({ where }),
  ]);
  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) };
}
