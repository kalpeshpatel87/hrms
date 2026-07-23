import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './report.controller.js';
import { monthYearQuerySchema, yearQuerySchema } from './report.validation.js';

export const reportRoutes = Router();

reportRoutes.get(
  '/headcount-by-department',
  ...requireAuth('report:read'),
  asyncHandler(controller.headcountByDepartmentHandler),
);
reportRoutes.get(
  '/attendance-summary',
  ...requireAuth('report:read'),
  validate(monthYearQuerySchema, 'query'),
  asyncHandler(controller.attendanceSummaryHandler),
);
reportRoutes.get(
  '/leave-summary',
  ...requireAuth('report:read'),
  validate(yearQuerySchema, 'query'),
  asyncHandler(controller.leaveSummaryHandler),
);
reportRoutes.get(
  '/payroll-summary',
  ...requireAuth('report:read'),
  validate(yearQuerySchema, 'query'),
  asyncHandler(controller.payrollSummaryHandler),
);
