import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { isProduction } from '../config/env.js';
import { ApiError } from '../lib/ApiError.js';
import { logger } from '../lib/logger.js';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) logger.error({ err, path: req.path }, err.message);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      (errors[key] ??= []).push(issue.message);
    }
    return res.status(400).json({ success: false, message: 'Validation failed', code: 'VALIDATION_ERROR', errors });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res
        .status(409)
        .json({ success: false, message: 'A record with these details already exists', code: 'DUPLICATE' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Resource not found', code: 'NOT_FOUND' });
    }
  }

  logger.error({ err, path: req.path }, 'Unhandled error');
  return res.status(500).json({
    success: false,
    message: isProduction ? 'Internal server error' : ((err as Error)?.message ?? 'Internal server error'),
    code: 'INTERNAL_ERROR',
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.method} ${req.path} not found`, code: 'ROUTE_NOT_FOUND' });
}
