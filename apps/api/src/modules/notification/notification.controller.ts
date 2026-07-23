import type { Request, Response } from 'express';
import { sendPaginated, sendSuccess } from '../../lib/response.js';
import * as notificationService from './notification.service.js';
import type { NotificationQuery } from './notification.validation.js';

export async function listMyNotificationsHandler(req: Request, res: Response) {
  const query = req.query as unknown as NotificationQuery;
  const result = await notificationService.listMyNotifications(req.user!.sub, query);
  return sendPaginated(res, result);
}

export async function getUnreadCountHandler(req: Request, res: Response) {
  const count = await notificationService.getUnreadCount(req.user!.sub);
  return sendSuccess(res, { count });
}

export async function markAsReadHandler(req: Request, res: Response) {
  const notification = await notificationService.markAsRead(req.user!.sub, req.params.id as string);
  return sendSuccess(res, notification);
}

export async function markAllAsReadHandler(req: Request, res: Response) {
  const result = await notificationService.markAllAsRead(req.user!.sub);
  return sendSuccess(res, result, `${result.count} notifications marked as read`);
}
