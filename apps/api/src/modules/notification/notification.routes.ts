import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './notification.controller.js';
import { notificationQuerySchema } from './notification.validation.js';

export const notificationRoutes = Router();

notificationRoutes.get(
  '/me',
  ...requireAuth(),
  validate(notificationQuerySchema, 'query'),
  asyncHandler(controller.listMyNotificationsHandler),
);
notificationRoutes.get('/me/unread-count', ...requireAuth(), asyncHandler(controller.getUnreadCountHandler));
notificationRoutes.post('/me/read-all', ...requireAuth(), asyncHandler(controller.markAllAsReadHandler));
notificationRoutes.patch('/:id/read', ...requireAuth(), asyncHandler(controller.markAsReadHandler));
