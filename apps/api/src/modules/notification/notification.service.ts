import type { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { buildPagination } from '../../lib/response.js';
import type { NotificationQuery } from './notification.validation.js';

export async function listMyNotifications(userId: string, query: NotificationQuery) {
  const where: Prisma.NotificationWhereInput = { userId };
  if (query.isRead !== undefined) where.isRead = query.isRead;
  if (query.type) where.type = query.type;

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.notification.count({ where }),
  ]);

  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markAsRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.userId !== userId) {
    throw ApiError.notFound('Notification not found');
  }
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllAsRead(userId: string): Promise<{ count: number }> {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

/**
 * Internal helper other modules import to push a notification (e.g. leave
 * approval, ticket assignment). Not exposed via any route — notifications
 * are always system-generated, never created directly by a client.
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  data?: Record<string, unknown>,
) {
  return prisma.notification.create({
    data: { userId, type, title, body, data: data as Prisma.InputJsonValue | undefined },
  });
}
