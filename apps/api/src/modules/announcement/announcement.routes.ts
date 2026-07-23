import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './announcement.controller.js';
import { uploadSingleAttachment } from './announcement.upload.js';
import { announcementQuerySchema, createAnnouncementSchema, updateAnnouncementSchema } from './announcement.validation.js';

export const announcementRoutes = Router();

announcementRoutes.get(
  '/',
  ...requireAuth(),
  validate(announcementQuerySchema, 'query'),
  asyncHandler(controller.listAnnouncementsHandler),
);
announcementRoutes.get('/:id', ...requireAuth(), asyncHandler(controller.getAnnouncementHandler));

announcementRoutes.post(
  '/',
  ...requireAuth('announcement:create'),
  validate(createAnnouncementSchema),
  asyncHandler(controller.createAnnouncementHandler),
);
announcementRoutes.patch(
  '/:id',
  ...requireAuth('announcement:update'),
  validate(updateAnnouncementSchema),
  asyncHandler(controller.updateAnnouncementHandler),
);
announcementRoutes.delete(
  '/:id',
  ...requireAuth('announcement:delete'),
  asyncHandler(controller.deleteAnnouncementHandler),
);

announcementRoutes.post(
  '/:id/attachments',
  ...requireAuth('announcement:update'),
  uploadSingleAttachment,
  asyncHandler(controller.addAttachmentHandler),
);
announcementRoutes.delete(
  '/:id/attachments/:attachmentId',
  ...requireAuth('announcement:update'),
  asyncHandler(controller.removeAttachmentHandler),
);
