import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './exit.controller.js';
import {
  createExitInterviewSchema,
  createResignationAdminSchema,
  createResignationSchema,
  resignationQuerySchema,
  updateExitTaskSchema,
} from './exit.validation.js';

export const exitRoutes = Router();

exitRoutes.post(
  '/resignations',
  ...requireAuth(),
  validate(createResignationSchema),
  asyncHandler(controller.createResignationHandler),
);

// Admin-only: file a resignation on behalf of a specific employee.
exitRoutes.post(
  '/resignations/admin',
  ...requireAuth('exit:create'),
  validate(createResignationAdminSchema),
  asyncHandler(controller.createResignationAdminHandler),
);
exitRoutes.get(
  '/resignations/me',
  ...requireAuth(),
  validate(resignationQuerySchema, 'query'),
  asyncHandler(controller.listMyResignationsHandler),
);
exitRoutes.get(
  '/resignations',
  ...requireAuth('exit:read'),
  validate(resignationQuerySchema, 'query'),
  asyncHandler(controller.listResignationsHandler),
);
exitRoutes.post('/resignations/:id/approve', ...requireAuth('exit:approve'), asyncHandler(controller.approveResignationHandler));
exitRoutes.post('/resignations/:id/reject', ...requireAuth('exit:approve'), asyncHandler(controller.rejectResignationHandler));

exitRoutes.patch(
  '/checklist-tasks/:id',
  ...requireAuth('exit:update'),
  validate(updateExitTaskSchema),
  asyncHandler(controller.updateExitTaskHandler),
);

exitRoutes.post(
  '/resignations/:id/interview',
  ...requireAuth('exit:update'),
  validate(createExitInterviewSchema),
  asyncHandler(controller.createExitInterviewHandler),
);
