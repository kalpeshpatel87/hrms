import type { RequestHandler } from 'express';
import { auditContext } from './auditContext.js';
import { authenticate } from './authenticate.js';
import { authorize, authorizeAny } from './authorize.js';

/** authenticate -> auditContext -> authorize(all of `permissions`). The standard chain for protected routes. */
export function requireAuth(...permissions: string[]): RequestHandler[] {
  return permissions.length > 0
    ? [authenticate, auditContext, authorize(...permissions)]
    : [authenticate, auditContext];
}

/** Same as requireAuth but only one of the listed permissions is required. */
export function requireAnyPermission(...permissions: string[]): RequestHandler[] {
  return [authenticate, auditContext, authorizeAny(...permissions)];
}
