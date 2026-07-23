import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './document.controller.js';
import { uploadSingleDocument } from './document.upload.js';
import { createDocumentMetaSchema, documentQuerySchema } from './document.validation.js';

export const documentRoutes = Router();

documentRoutes.get(
  '/',
  ...requireAuth('document:read'),
  validate(documentQuerySchema, 'query'),
  asyncHandler(controller.listDocumentsHandler),
);
documentRoutes.get(
  '/me',
  ...requireAuth(),
  validate(documentQuerySchema, 'query'),
  asyncHandler(controller.listMyDocumentsHandler),
);

documentRoutes.post(
  '/',
  ...requireAuth(),
  uploadSingleDocument,
  validate(createDocumentMetaSchema),
  asyncHandler(controller.createDocumentHandler),
);
documentRoutes.post(
  '/:id/versions',
  ...requireAuth('document:update'),
  uploadSingleDocument,
  asyncHandler(controller.addVersionHandler),
);
documentRoutes.get('/:id/download', ...requireAuth(), asyncHandler(controller.downloadDocumentHandler));
documentRoutes.delete('/:id', ...requireAuth('document:delete'), asyncHandler(controller.deleteDocumentHandler));
