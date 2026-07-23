import { Router } from 'express';
import { paginationQuerySchema } from '@atyantik/shared-types';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './asset.controller.js';
import {
  assetMaintenanceSchema,
  assetQuerySchema,
  assetSchema,
  assignAssetSchema,
  returnAssetSchema,
  updateAssetSchema,
  updateVendorSchema,
  vendorSchema,
} from './asset.validation.js';

export const assetRoutes = Router();

assetRoutes.get('/me', ...requireAuth(), asyncHandler(controller.listMyAssetsHandler));

assetRoutes.get(
  '/vendors',
  ...requireAuth('asset:read'),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(controller.listVendorsHandler),
);
assetRoutes.post('/vendors', ...requireAuth('asset:create'), validate(vendorSchema), asyncHandler(controller.createVendorHandler));
assetRoutes.patch(
  '/vendors/:id',
  ...requireAuth('asset:update'),
  validate(updateVendorSchema),
  asyncHandler(controller.updateVendorHandler),
);
assetRoutes.delete('/vendors/:id', ...requireAuth('asset:delete'), asyncHandler(controller.deleteVendorHandler));

assetRoutes.get(
  '/',
  ...requireAuth('asset:read'),
  validate(assetQuerySchema, 'query'),
  asyncHandler(controller.listAssetsHandler),
);
assetRoutes.post('/', ...requireAuth('asset:create'), validate(assetSchema), asyncHandler(controller.createAssetHandler));
assetRoutes.patch(
  '/:id',
  ...requireAuth('asset:update'),
  validate(updateAssetSchema),
  asyncHandler(controller.updateAssetHandler),
);
assetRoutes.delete('/:id', ...requireAuth('asset:delete'), asyncHandler(controller.deleteAssetHandler));

assetRoutes.post(
  '/:id/assign',
  ...requireAuth('asset:update'),
  validate(assignAssetSchema),
  asyncHandler(controller.assignAssetHandler),
);
assetRoutes.post(
  '/assignments/:id/return',
  ...requireAuth('asset:update'),
  validate(returnAssetSchema),
  asyncHandler(controller.returnAssetHandler),
);

assetRoutes.post(
  '/:id/maintenance',
  ...requireAuth('asset:update'),
  validate(assetMaintenanceSchema),
  asyncHandler(controller.createMaintenanceHandler),
);
assetRoutes.get('/:id/maintenance', ...requireAuth('asset:read'), asyncHandler(controller.listMaintenanceHandler));
