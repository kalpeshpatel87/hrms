import { prisma } from '../db/prisma.js';
import { getRequestContext } from './requestContext.js';

export interface AuditLogInput {
  action: string; // 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'APPROVE' | 'REJECT' | 'DOWNLOAD' | 'EXPORT' | ...
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

/** Fire-and-forget audit write. Never throws into the caller's request path. */
export async function recordAuditLog(input: AuditLogInput): Promise<void> {
  const ctx = getRequestContext();
  try {
    await prisma.auditLog.create({
      data: {
        actorId: ctx?.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        before: input.before === undefined ? undefined : (input.before as object),
        after: input.after === undefined ? undefined : (input.after as object),
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: input.metadata,
      },
    });
  } catch {
    // Audit logging must never break the primary request flow. A future pass
    // can add a dead-letter fallback (e.g. write-to-file) if this matters.
  }
}
