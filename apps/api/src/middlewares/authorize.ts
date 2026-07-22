import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/ApiError.js';

/**
 * The single chokepoint enforcing `Permission.key` checks (e.g. "leave:approve").
 * Every module route that isn't pure self-service should chain this after
 * `authenticate`. Requires ALL listed permissions.
 */
export function authorize(...requiredPermissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    const has = requiredPermissions.every((p) => req.user!.permissions.includes(p));
    if (!has) return next(ApiError.forbidden());
    next();
  };
}

/** Requires at least one of the listed permissions. */
export function authorizeAny(...anyOfPermissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    const has = anyOfPermissions.some((p) => req.user!.permissions.includes(p));
    if (!has) return next(ApiError.forbidden());
    next();
  };
}
