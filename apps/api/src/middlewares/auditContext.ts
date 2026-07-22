import type { NextFunction, Request, Response } from 'express';
import { runWithRequestContext } from '../lib/requestContext.js';

/**
 * Populates AsyncLocalStorage with the current actor/ip/user-agent so the
 * Prisma extension (src/db/prisma.ts) can auto-stamp createdBy/updatedBy
 * and so audit-log writes don't need this threaded through every service
 * call manually. Must run after `authenticate` to see `req.user`.
 */
export function auditContext(req: Request, _res: Response, next: NextFunction) {
  runWithRequestContext(
    {
      userId: req.user?.sub,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
    next,
  );
}
