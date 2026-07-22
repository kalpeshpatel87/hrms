import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { ApiError } from '../lib/ApiError.js';
import { verifyAccessToken, type AccessTokenPayload } from '../lib/jwt.js';

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return next(ApiError.unauthorized());

  let payload: AccessTokenPayload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return next(ApiError.unauthorized('Invalid or expired access token'));
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      return next(ApiError.unauthorized('Account is inactive or no longer exists'));
    }
    if (user.tokenVersion !== payload.tokenVersion) {
      return next(ApiError.unauthorized('Session has been invalidated, please sign in again'));
    }
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}
