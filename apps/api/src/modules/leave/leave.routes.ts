import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './leave.controller.js';
import {
  accrueLeaveBalancesSchema,
  adjustLeaveBalanceSchema,
  adminLeaveBalanceQuerySchema,
  approvalActionSchema,
  cancelLeaveRequestSchema,
  createLeavePolicySchema,
  createLeaveRequestAdminSchema,
  createLeaveRequestSchema,
  createLeaveTypeSchema,
  idParamSchema,
  leaveApprovalQuerySchema,
  leaveBalanceQuerySchema,
  leavePolicyQuerySchema,
  leaveRequestAdminQuerySchema,
  leaveRequestMeQuerySchema,
  leaveTypeQuerySchema,
  updateLeavePolicySchema,
  updateLeaveTypeSchema,
} from './leave.validation.js';

export const leaveRoutes = Router();

// ---------------------------------------------------------------------------
// LeaveType (admin-only catalog management)
// ---------------------------------------------------------------------------

leaveRoutes.get(
  '/types',
  ...requireAuth('leave:read'),
  validate(leaveTypeQuerySchema, 'query'),
  asyncHandler(controller.listLeaveTypesHandler),
);

leaveRoutes.post(
  '/types',
  ...requireAuth('leave:update'),
  validate(createLeaveTypeSchema),
  asyncHandler(controller.createLeaveTypeHandler),
);

leaveRoutes.patch(
  '/types/:id',
  ...requireAuth('leave:update'),
  validate(idParamSchema, 'params'),
  validate(updateLeaveTypeSchema),
  asyncHandler(controller.updateLeaveTypeHandler),
);

// ---------------------------------------------------------------------------
// LeavePolicy (admin-only catalog management)
// ---------------------------------------------------------------------------

leaveRoutes.get(
  '/policies',
  ...requireAuth('leave:read'),
  validate(leavePolicyQuerySchema, 'query'),
  asyncHandler(controller.listLeavePoliciesHandler),
);

leaveRoutes.post(
  '/policies',
  ...requireAuth('leave:update'),
  validate(createLeavePolicySchema),
  asyncHandler(controller.createLeavePolicyHandler),
);

leaveRoutes.patch(
  '/policies/:id',
  ...requireAuth('leave:update'),
  validate(idParamSchema, 'params'),
  validate(updateLeavePolicySchema),
  asyncHandler(controller.updateLeavePolicyHandler),
);

// ---------------------------------------------------------------------------
// LeaveBalance (self-service)
// ---------------------------------------------------------------------------

leaveRoutes.get(
  '/balances/me',
  ...requireAuth(),
  validate(leaveBalanceQuerySchema, 'query'),
  asyncHandler(controller.getMyLeaveBalancesHandler),
);

// Admin-only: backfill missing LeaveBalance rows for a year (new hires, newly added policies).
leaveRoutes.post(
  '/balances/accrue',
  ...requireAuth('leave:update'),
  validate(accrueLeaveBalancesSchema),
  asyncHandler(controller.accrueLeaveBalancesHandler),
);

// Admin-only: view a specific employee's leave balances.
leaveRoutes.get(
  '/balances',
  ...requireAuth('leave:update'),
  validate(adminLeaveBalanceQuerySchema, 'query'),
  asyncHandler(controller.listEmployeeLeaveBalancesHandler),
);

// Admin-only: add or remove days from an employee's leave balance.
leaveRoutes.post(
  '/balances/adjust',
  ...requireAuth('leave:update'),
  validate(adjustLeaveBalanceSchema),
  asyncHandler(controller.adjustLeaveBalanceHandler),
);

// ---------------------------------------------------------------------------
// LeaveRequest
// ---------------------------------------------------------------------------

leaveRoutes.post(
  '/requests',
  ...requireAuth(),
  validate(createLeaveRequestSchema),
  asyncHandler(controller.createLeaveRequestHandler),
);

leaveRoutes.get(
  '/requests/me',
  ...requireAuth(),
  validate(leaveRequestMeQuerySchema, 'query'),
  asyncHandler(controller.listMyLeaveRequestsHandler),
);

leaveRoutes.post(
  '/requests/:id/cancel',
  ...requireAuth(),
  validate(idParamSchema, 'params'),
  validate(cancelLeaveRequestSchema),
  asyncHandler(controller.cancelLeaveRequestHandler),
);

leaveRoutes.get(
  '/requests',
  ...requireAuth('leave:read'),
  validate(leaveRequestAdminQuerySchema, 'query'),
  asyncHandler(controller.listAllLeaveRequestsHandler),
);

// Admin-only: apply leave on behalf of a specific employee (e.g. a phoned-in request).
leaveRoutes.post(
  '/requests/admin',
  ...requireAuth('leave:update'),
  validate(createLeaveRequestAdminSchema),
  asyncHandler(controller.createLeaveRequestAdminHandler),
);

// ---------------------------------------------------------------------------
// LeaveApproval
// ---------------------------------------------------------------------------

leaveRoutes.get(
  '/approvals/pending',
  ...requireAuth('leave:approve'),
  validate(leaveApprovalQuerySchema, 'query'),
  asyncHandler(controller.listPendingApprovalsHandler),
);

leaveRoutes.post(
  '/approvals/:id/approve',
  ...requireAuth('leave:approve'),
  validate(idParamSchema, 'params'),
  validate(approvalActionSchema),
  asyncHandler(controller.approveLeaveRequestHandler),
);

leaveRoutes.post(
  '/approvals/:id/reject',
  ...requireAuth('leave:approve'),
  validate(idParamSchema, 'params'),
  validate(approvalActionSchema),
  asyncHandler(controller.rejectLeaveRequestHandler),
);
