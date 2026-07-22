import { randomBytes } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { isProduction } from '../config/env.js';
import { ApiError } from '../lib/ApiError.js';

// Double-submit-cookie CSRF: the `csurf` package is deprecated, so this is a
// small, explicit implementation instead. Only matters for endpoints that
// rely on the browser auto-sending the httpOnly refresh cookie (refresh,
// logout) — endpoints authenticated via an explicit `Authorization: Bearer`
// header are not vulnerable to classic CSRF since a cross-site request can't
// set that header itself.
const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

export function issueCsrfCookie(res: Response): string {
  const token = randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
  return token;
}

export function verifyCsrf(req: Request, _res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(ApiError.forbidden('CSRF token missing or invalid'));
  }
  next();
}
