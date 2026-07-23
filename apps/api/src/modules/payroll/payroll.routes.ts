import { Router } from 'express';
import { paginationQuerySchema } from '@atyantik/shared-types';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './payroll.controller.js';
import {
  createDeductionSchema,
  createPayrollRunSchema,
  createReimbursementSchema,
  createSalaryStructureSchema,
  deductionQuerySchema,
  payrollRunQuerySchema,
  reimbursementDecisionSchema,
  reimbursementQuerySchema,
} from './payroll.validation.js';

export const payrollRoutes = Router();

// ---------------------------------------------------------------------------
// Salary components / structures
// ---------------------------------------------------------------------------

payrollRoutes.get(
  '/components',
  ...requireAuth('payroll:read'),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(controller.listSalaryComponentsHandler),
);

payrollRoutes.get(
  '/structures/:employeeId',
  ...requireAuth('payroll:read'),
  asyncHandler(controller.getActiveSalaryStructureHandler),
);
payrollRoutes.post(
  '/structures',
  ...requireAuth('payroll:create'),
  validate(createSalaryStructureSchema),
  asyncHandler(controller.createSalaryStructureHandler),
);

// ---------------------------------------------------------------------------
// Payroll runs
// ---------------------------------------------------------------------------

payrollRoutes.get(
  '/runs',
  ...requireAuth('payroll:read'),
  validate(payrollRunQuerySchema, 'query'),
  asyncHandler(controller.listPayrollRunsHandler),
);
payrollRoutes.post(
  '/runs',
  ...requireAuth('payroll:create'),
  validate(createPayrollRunSchema),
  asyncHandler(controller.createPayrollRunHandler),
);
payrollRoutes.post(
  '/runs/:id/approve',
  ...requireAuth('payroll:approve'),
  asyncHandler(controller.approvePayrollRunHandler),
);

// ---------------------------------------------------------------------------
// Payslips
// ---------------------------------------------------------------------------

payrollRoutes.get(
  '/payslips/me',
  ...requireAuth(),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(controller.listMyPayslipsHandler),
);
payrollRoutes.get('/payslips/:id/download', ...requireAuth(), asyncHandler(controller.downloadPayslipHandler));

// ---------------------------------------------------------------------------
// Reimbursements
// ---------------------------------------------------------------------------

payrollRoutes.get(
  '/reimbursements',
  ...requireAuth('payroll:read'),
  validate(reimbursementQuerySchema, 'query'),
  asyncHandler(controller.listReimbursementsHandler),
);
payrollRoutes.post(
  '/reimbursements',
  ...requireAuth('payroll:create'),
  validate(createReimbursementSchema),
  asyncHandler(controller.createReimbursementHandler),
);
payrollRoutes.post(
  '/reimbursements/:id/decide',
  ...requireAuth('payroll:approve'),
  validate(reimbursementDecisionSchema),
  asyncHandler(controller.decideReimbursementHandler),
);

// ---------------------------------------------------------------------------
// Deductions
// ---------------------------------------------------------------------------

payrollRoutes.get(
  '/deductions',
  ...requireAuth('payroll:read'),
  validate(deductionQuerySchema, 'query'),
  asyncHandler(controller.listDeductionsHandler),
);
payrollRoutes.post(
  '/deductions',
  ...requireAuth('payroll:create'),
  validate(createDeductionSchema),
  asyncHandler(controller.createDeductionHandler),
);
