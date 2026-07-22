import type { Response } from 'express';
import type { PaginatedResult } from '@atyantik/shared-types';

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, message });
}

export function sendPaginated<T>(res: Response, result: PaginatedResult<T>, message?: string) {
  return res.status(200).json({ success: true, data: result, message });
}

export function sendCreated<T>(res: Response, data: T, message = 'Created successfully') {
  return sendSuccess(res, data, message, 201);
}

export function sendNoContent(res: Response) {
  return res.status(204).send();
}

export function buildPagination(total: number, page: number, pageSize: number) {
  return { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
