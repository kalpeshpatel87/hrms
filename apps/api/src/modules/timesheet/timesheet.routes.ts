import { Router } from 'express';
import { paginationQuerySchema } from '@atyantik/shared-types';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './timesheet.controller.js';
import {
  clientSchema,
  createTimesheetSchema,
  projectAssignmentSchema,
  projectQuerySchema,
  projectSchema,
  timesheetQuerySchema,
  updateClientSchema,
  updateProjectSchema,
} from './timesheet.validation.js';

export const timesheetRoutes = Router();

timesheetRoutes.get(
  '/clients',
  ...requireAuth('timesheet:read'),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(controller.listClientsHandler),
);
timesheetRoutes.post(
  '/clients',
  ...requireAuth('timesheet:create'),
  validate(clientSchema),
  asyncHandler(controller.createClientHandler),
);
timesheetRoutes.patch(
  '/clients/:id',
  ...requireAuth('timesheet:create'),
  validate(updateClientSchema),
  asyncHandler(controller.updateClientHandler),
);

timesheetRoutes.get(
  '/projects',
  ...requireAuth('timesheet:read'),
  validate(projectQuerySchema, 'query'),
  asyncHandler(controller.listProjectsHandler),
);
// Project management is restricted to timesheet:approve (Super Admin only today) — unlike
// timesheet:create, which the seeded Employee role also holds for logging their own time.
timesheetRoutes.post(
  '/projects',
  ...requireAuth('timesheet:approve'),
  validate(projectSchema),
  asyncHandler(controller.createProjectHandler),
);
timesheetRoutes.patch(
  '/projects/:id',
  ...requireAuth('timesheet:approve'),
  validate(updateProjectSchema),
  asyncHandler(controller.updateProjectHandler),
);
timesheetRoutes.post(
  '/projects/:id/assignments',
  ...requireAuth('timesheet:create'),
  validate(projectAssignmentSchema),
  asyncHandler(controller.assignToProjectHandler),
);
timesheetRoutes.get(
  '/projects/:id/assignments',
  ...requireAuth('timesheet:read'),
  asyncHandler(controller.listProjectAssignmentsHandler),
);

timesheetRoutes.get(
  '/me',
  ...requireAuth(),
  validate(timesheetQuerySchema, 'query'),
  asyncHandler(controller.listMyTimesheetsHandler),
);
timesheetRoutes.put(
  '/',
  ...requireAuth(),
  validate(createTimesheetSchema),
  asyncHandler(controller.createOrUpdateTimesheetHandler),
);
timesheetRoutes.post('/:id/submit', ...requireAuth(), asyncHandler(controller.submitTimesheetHandler));
timesheetRoutes.post('/:id/approve', ...requireAuth('timesheet:approve'), asyncHandler(controller.approveTimesheetHandler));
timesheetRoutes.post('/:id/reject', ...requireAuth('timesheet:approve'), asyncHandler(controller.rejectTimesheetHandler));
