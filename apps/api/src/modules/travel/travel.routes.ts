import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './travel.controller.js';
import { createTravelRequestSchema, travelDecisionSchema, travelQuerySchema } from './travel.validation.js';

export const travelRoutes = Router();

travelRoutes.post(
  '/requests',
  ...requireAuth(),
  validate(createTravelRequestSchema),
  asyncHandler(controller.createTravelRequestHandler),
);
travelRoutes.get(
  '/requests/me',
  ...requireAuth(),
  validate(travelQuerySchema, 'query'),
  asyncHandler(controller.listMyTravelRequestsHandler),
);
travelRoutes.get(
  '/requests',
  ...requireAuth('travel:read'),
  validate(travelQuerySchema, 'query'),
  asyncHandler(controller.listTravelRequestsHandler),
);
travelRoutes.post(
  '/requests/:id/decide',
  ...requireAuth('travel:approve'),
  validate(travelDecisionSchema),
  asyncHandler(controller.decideTravelRequestHandler),
);
