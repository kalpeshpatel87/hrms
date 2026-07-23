import type { Prisma } from '@prisma/client';
import { prisma, softDelete } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { recordAuditLog } from '../../lib/auditLog.js';
import { buildPagination } from '../../lib/response.js';
import { getStorageProvider } from '../../lib/storage/index.js';
import type { CreateDocumentMetaInput, DocumentQuery } from './document.validation.js';

const documentInclude = {
  currentVersion: true,
  ownerEmployee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
} satisfies Prisma.DocumentInclude;

async function resolveEmployeeForUser(userId: string) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw ApiError.badRequest('No employee profile is linked to this account');
  return employee;
}

export async function listDocuments(query: DocumentQuery) {
  const where: Prisma.DocumentWhereInput = {};
  if (query.category) where.category = query.category;
  if (query.entityType) where.entityType = query.entityType;
  if (query.entityId) where.entityId = query.entityId;
  if (query.ownerEmployeeId) where.ownerEmployeeId = query.ownerEmployeeId;
  if (query.search) where.title = { contains: query.search, mode: 'insensitive' };

  const [items, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: documentInclude,
      orderBy: { createdAt: query.sortDir },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.document.count({ where }),
  ]);

  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function listMyDocuments(userId: string, query: DocumentQuery) {
  const employee = await resolveEmployeeForUser(userId);
  return listDocuments({ ...query, ownerEmployeeId: employee.id });
}

export async function createDocument(
  input: CreateDocumentMetaInput,
  file: Express.Multer.File,
  actorEmployeeId: string | undefined,
) {
  const storage = getStorageProvider();
  const stored = await storage.save({
    buffer: file.buffer,
    originalName: file.originalname,
    mimeType: file.mimetype,
    folder: 'documents',
  });

  const result = await prisma.$transaction(async (tx) => {
    const document = await tx.document.create({
      data: {
        title: input.title,
        category: input.category,
        entityType: input.entityType,
        entityId: input.entityId,
        ownerEmployeeId: input.ownerEmployeeId ?? actorEmployeeId,
        isConfidential: input.isConfidential,
      },
    });

    const version = await tx.documentVersion.create({
      data: {
        documentId: document.id,
        versionNo: 1,
        fileUrl: stored.url,
        fileSize: stored.size,
        mimeType: stored.mimeType,
      },
    });

    return tx.document.update({
      where: { id: document.id },
      data: { currentVersionId: version.id },
      include: documentInclude,
    });
  });

  await recordAuditLog({ action: 'CREATE', entityType: 'Document', entityId: result.id, after: result });
  return result;
}

export async function addVersion(documentId: string, file: Express.Multer.File) {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) throw ApiError.notFound('Document not found');

  const storage = getStorageProvider();
  const stored = await storage.save({
    buffer: file.buffer,
    originalName: file.originalname,
    mimeType: file.mimetype,
    folder: `documents/${documentId}`,
  });

  const latest = await prisma.documentVersion.findFirst({
    where: { documentId },
    orderBy: { versionNo: 'desc' },
  });
  const nextVersionNo = (latest?.versionNo ?? 0) + 1;

  const result = await prisma.$transaction(async (tx) => {
    const version = await tx.documentVersion.create({
      data: {
        documentId,
        versionNo: nextVersionNo,
        fileUrl: stored.url,
        fileSize: stored.size,
        mimeType: stored.mimeType,
      },
    });
    return tx.document.update({
      where: { id: documentId },
      data: { currentVersionId: version.id },
      include: documentInclude,
    });
  });

  await recordAuditLog({ action: 'UPDATE', entityType: 'Document', entityId: documentId, after: result });
  return result;
}

export async function getDocumentForDownload(
  documentId: string,
  requester: { sub: string; permissions: string[] },
) {
  const document = await prisma.document.findUnique({ where: { id: documentId }, include: documentInclude });
  if (!document) throw ApiError.notFound('Document not found');

  const canReadAny = requester.permissions.includes('document:read');
  if (!canReadAny) {
    const employee = await resolveEmployeeForUser(requester.sub);
    if (document.ownerEmployeeId !== employee.id) {
      throw ApiError.forbidden('You do not have access to this document');
    }
  }
  if (document.isConfidential && !canReadAny) {
    throw ApiError.forbidden('This document is confidential');
  }
  if (!document.currentVersion) throw ApiError.notFound('This document has no uploaded version yet');

  await recordAuditLog({ action: 'DOWNLOAD', entityType: 'Document', entityId: document.id });
  return document.currentVersion;
}

export async function deleteDocument(documentId: string): Promise<void> {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) throw ApiError.notFound('Document not found');
  await softDelete('Document', documentId);
  await recordAuditLog({ action: 'DELETE', entityType: 'Document', entityId: documentId, before: document });
}
