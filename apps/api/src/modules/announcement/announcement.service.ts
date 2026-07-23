import { AnnouncementAudience, Prisma } from '@prisma/client';
import type { PaginatedResult } from '@atyantik/shared-types';
import { prisma, softDelete } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { recordAuditLog } from '../../lib/auditLog.js';
import { buildPagination } from '../../lib/response.js';
import { getStorageProvider } from '../../lib/storage/index.js';
import type { AnnouncementQuery, CreateAnnouncementInput, UpdateAnnouncementInput } from './announcement.validation.js';

/** Resolves the calling user's own Employee row — every self-service read scopes off this. */
async function resolveEmployeeForUser(userId: string) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw ApiError.badRequest('No employee profile is linked to this account');
  return employee;
}

/**
 * This app runs a single-company deployment (see org module: Company has no
 * create endpoint and org.validation.ts never asks callers for a companyId).
 * Announcements follow the same convention — the company is resolved rather
 * than accepted from the request body.
 */
async function resolveDefaultCompanyId(): Promise<string> {
  const company = await prisma.company.findFirst({ select: { id: true } });
  if (!company) throw ApiError.badRequest('No company record exists yet');
  return company.id;
}

interface AudienceTargets {
  audience: AnnouncementAudience;
  targetDepartmentId?: string | null;
  targetBranchId?: string | null;
  targetRoleId?: string | null;
}

/** Ensures the target id required by `audience` is present and refers to a real row. */
async function validateAudienceTargets(input: AudienceTargets): Promise<void> {
  if (input.audience === AnnouncementAudience.DEPARTMENT) {
    if (!input.targetDepartmentId) {
      throw ApiError.badRequest('targetDepartmentId is required when audience is DEPARTMENT');
    }
    const department = await prisma.department.findUnique({ where: { id: input.targetDepartmentId } });
    if (!department) throw ApiError.badRequest('targetDepartmentId does not refer to an existing department');
  }
  if (input.audience === AnnouncementAudience.BRANCH) {
    if (!input.targetBranchId) {
      throw ApiError.badRequest('targetBranchId is required when audience is BRANCH');
    }
    const branch = await prisma.branch.findUnique({ where: { id: input.targetBranchId } });
    if (!branch) throw ApiError.badRequest('targetBranchId does not refer to an existing branch');
  }
  if (input.audience === AnnouncementAudience.ROLE) {
    if (!input.targetRoleId) {
      throw ApiError.badRequest('targetRoleId is required when audience is ROLE');
    }
    const role = await prisma.role.findUnique({ where: { id: input.targetRoleId } });
    if (!role) throw ApiError.badRequest('targetRoleId does not refer to an existing role');
  }
}

const announcementInclude = {
  attachments: true,
  targetDepartment: { select: { id: true, name: true } },
  targetBranch: { select: { id: true, name: true } },
  targetRole: { select: { id: true, name: true } },
} satisfies Prisma.AnnouncementInclude;

/**
 * Self-service read: any authenticated user sees active announcements
 * (publishAt <= now, not yet expired) scoped to their own audience.
 *
 * ALL_EMPLOYEES is always visible. DEPARTMENT/BRANCH/ROLE are visible only
 * when they match the caller's own department/branch/role. SPECIFIC_EMPLOYEES
 * targeting is out of scope for this pass — there's no join table wiring an
 * announcement to individual employees yet, so those rows are shown to
 * everyone rather than hidden entirely. Revisit once that table exists.
 */
export async function listVisibleAnnouncements(
  userId: string,
  query: AnnouncementQuery,
): Promise<PaginatedResult<unknown>> {
  const { page, pageSize, sortBy, sortDir, search, isPinned } = query;
  const employee = await resolveEmployeeForUser(userId);

  const userRoles = await prisma.userRole.findMany({ where: { userId }, select: { roleId: true } });
  const roleIds = userRoles.map((ur) => ur.roleId);

  const now = new Date();

  const audienceOr: Prisma.AnnouncementWhereInput[] = [
    { audience: AnnouncementAudience.ALL_EMPLOYEES },
    // NOTE: see the SPECIFIC_EMPLOYEES limitation documented above.
    { audience: AnnouncementAudience.SPECIFIC_EMPLOYEES },
  ];
  if (employee.departmentId) {
    audienceOr.push({ audience: AnnouncementAudience.DEPARTMENT, targetDepartmentId: employee.departmentId });
  }
  if (employee.branchId) {
    audienceOr.push({ audience: AnnouncementAudience.BRANCH, targetBranchId: employee.branchId });
  }
  if (roleIds.length > 0) {
    audienceOr.push({ audience: AnnouncementAudience.ROLE, targetRoleId: { in: roleIds } });
  }

  const and: Prisma.AnnouncementWhereInput[] = [
    { companyId: employee.companyId },
    { publishAt: { lte: now } },
    { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    { OR: audienceOr },
  ];
  if (isPinned !== undefined) and.push({ isPinned });
  if (search) {
    and.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  const where: Prisma.AnnouncementWhereInput = { AND: and };

  const sortableFields = new Set(['publishAt', 'expiresAt', 'createdAt', 'title']);
  const orderBy: Prisma.AnnouncementOrderByWithRelationInput[] = [
    { isPinned: 'desc' },
    sortableFields.has(sortBy ?? '') ? { [sortBy as string]: sortDir } : { publishAt: sortDir },
  ];

  const [items, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: announcementInclude,
    }),
    prisma.announcement.count({ where }),
  ]);

  return { items, ...buildPagination(total, page, pageSize) };
}

export async function createAnnouncement(input: CreateAnnouncementInput) {
  await validateAudienceTargets(input);
  const companyId = await resolveDefaultCompanyId();

  const created = await prisma.announcement.create({
    data: {
      companyId,
      title: input.title,
      body: input.body,
      audience: input.audience,
      targetDepartmentId: input.audience === AnnouncementAudience.DEPARTMENT ? input.targetDepartmentId : null,
      targetBranchId: input.audience === AnnouncementAudience.BRANCH ? input.targetBranchId : null,
      targetRoleId: input.audience === AnnouncementAudience.ROLE ? input.targetRoleId : null,
      publishAt: input.publishAt ?? new Date(),
      expiresAt: input.expiresAt ?? null,
      isPinned: input.isPinned,
    },
    include: announcementInclude,
  });

  await recordAuditLog({ action: 'CREATE', entityType: 'Announcement', entityId: created.id, after: created });
  return created;
}

export async function getAnnouncementOrThrow(id: string) {
  const announcement = await prisma.announcement.findUnique({ where: { id }, include: announcementInclude });
  if (!announcement) throw ApiError.notFound('Announcement not found');
  return announcement;
}

export async function updateAnnouncement(id: string, input: UpdateAnnouncementInput) {
  const existing = await getAnnouncementOrThrow(id);

  const audienceOrTargetsChanged =
    input.audience !== undefined ||
    input.targetDepartmentId !== undefined ||
    input.targetBranchId !== undefined ||
    input.targetRoleId !== undefined;

  const mergedAudience = input.audience ?? existing.audience;
  const mergedTargets: AudienceTargets = {
    audience: mergedAudience,
    targetDepartmentId: input.targetDepartmentId !== undefined ? input.targetDepartmentId : existing.targetDepartmentId,
    targetBranchId: input.targetBranchId !== undefined ? input.targetBranchId : existing.targetBranchId,
    targetRoleId: input.targetRoleId !== undefined ? input.targetRoleId : existing.targetRoleId,
  };
  if (audienceOrTargetsChanged) {
    await validateAudienceTargets(mergedTargets);
  }

  const data: Prisma.AnnouncementUncheckedUpdateInput = {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.body !== undefined && { body: input.body }),
    ...(input.publishAt !== undefined && { publishAt: input.publishAt }),
    ...(input.expiresAt !== undefined && { expiresAt: input.expiresAt }),
    ...(input.isPinned !== undefined && { isPinned: input.isPinned }),
  };
  if (audienceOrTargetsChanged) {
    data.audience = mergedAudience;
    data.targetDepartmentId = mergedAudience === AnnouncementAudience.DEPARTMENT ? mergedTargets.targetDepartmentId : null;
    data.targetBranchId = mergedAudience === AnnouncementAudience.BRANCH ? mergedTargets.targetBranchId : null;
    data.targetRoleId = mergedAudience === AnnouncementAudience.ROLE ? mergedTargets.targetRoleId : null;
  }

  const updated = await prisma.announcement.update({ where: { id }, data, include: announcementInclude });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Announcement', entityId: id, before: existing, after: updated });
  return updated;
}

export async function removeAnnouncement(id: string): Promise<void> {
  const existing = await getAnnouncementOrThrow(id);
  await softDelete('Announcement', id);
  await recordAuditLog({ action: 'DELETE', entityType: 'Announcement', entityId: id, before: existing });
}

/**
 * LocalStorageProvider serves saved files at `/uploads/<key>` (see
 * LocalStorageProvider.getUrl). AnnouncementAttachment only stores the URL,
 * not the raw key, so this strips that fixed prefix back off to recover it
 * for storage.delete(). If a future S3-backed provider returns a different
 * URL shape, add a dedicated storageKey column instead of guessing here.
 */
function storageKeyFromUrl(fileUrl: string): string {
  const prefix = '/uploads/';
  return fileUrl.startsWith(prefix) ? fileUrl.slice(prefix.length) : fileUrl;
}

export async function addAttachment(announcementId: string, file: Express.Multer.File) {
  await getAnnouncementOrThrow(announcementId);

  const storage = getStorageProvider();
  const stored = await storage.save({
    buffer: file.buffer,
    originalName: file.originalname,
    mimeType: file.mimetype,
    folder: `announcements/${announcementId}`,
  });

  const attachment = await prisma.announcementAttachment.create({
    data: {
      announcementId,
      fileUrl: stored.url,
      fileName: file.originalname,
      mimeType: file.mimetype,
    },
  });

  await recordAuditLog({
    action: 'CREATE',
    entityType: 'AnnouncementAttachment',
    entityId: attachment.id,
    after: attachment,
  });
  return attachment;
}

export async function removeAttachment(announcementId: string, attachmentId: string): Promise<void> {
  const attachment = await prisma.announcementAttachment.findUnique({ where: { id: attachmentId } });
  if (!attachment || attachment.announcementId !== announcementId) {
    throw ApiError.notFound('Attachment not found');
  }

  const storage = getStorageProvider();
  await storage.delete(storageKeyFromUrl(attachment.fileUrl)).catch(() => undefined);

  // AnnouncementAttachment has no deletedAt column — this is a genuine hard delete.
  await prisma.announcementAttachment.delete({ where: { id: attachmentId } });

  await recordAuditLog({
    action: 'DELETE',
    entityType: 'AnnouncementAttachment',
    entityId: attachmentId,
    before: attachment,
  });
}
