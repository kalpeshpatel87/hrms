import type { Request, Response } from 'express';
import { sendCreated, sendPaginated, sendSuccess, buildPagination } from '../../lib/response.js';
import * as leaveService from './leave.service.js';
import type {
  AccrueLeaveBalancesInput,
  ApprovalActionInput,
  CancelLeaveRequestInput,
  CreateLeavePolicyInput,
  CreateLeaveRequestAdminInput,
  CreateLeaveRequestInput,
  CreateLeaveTypeInput,
  IdParam,
  LeaveApprovalQuery,
  LeaveBalanceQuery,
  LeavePolicyQuery,
  LeaveRequestAdminQuery,
  LeaveRequestMeQuery,
  LeaveTypeQuery,
  UpdateLeavePolicyInput,
  UpdateLeaveTypeInput,
} from './leave.validation.js';

// ---------------------------------------------------------------------------
// LeaveType
// ---------------------------------------------------------------------------

export async function listLeaveTypesHandler(req: Request, res: Response) {
  const query = req.query as unknown as LeaveTypeQuery;
  const { items, total } = await leaveService.listLeaveTypes(req.user!.sub, query);
  return sendPaginated(res, { items, ...buildPagination(total, query.page, query.pageSize) });
}

export async function createLeaveTypeHandler(req: Request, res: Response) {
  const body = req.body as CreateLeaveTypeInput;
  const leaveType = await leaveService.createLeaveType(req.user!.sub, body);
  return sendCreated(res, leaveType);
}

export async function updateLeaveTypeHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  const body = req.body as UpdateLeaveTypeInput;
  const leaveType = await leaveService.updateLeaveType(id, body);
  return sendSuccess(res, leaveType, 'Leave type updated successfully');
}

// ---------------------------------------------------------------------------
// LeavePolicy
// ---------------------------------------------------------------------------

export async function listLeavePoliciesHandler(req: Request, res: Response) {
  const query = req.query as unknown as LeavePolicyQuery;
  const { items, total } = await leaveService.listLeavePolicies(req.user!.sub, query);
  return sendPaginated(res, { items, ...buildPagination(total, query.page, query.pageSize) });
}

export async function createLeavePolicyHandler(req: Request, res: Response) {
  const body = req.body as CreateLeavePolicyInput;
  const policy = await leaveService.createLeavePolicy(req.user!.sub, body);
  return sendCreated(res, policy);
}

export async function updateLeavePolicyHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  const body = req.body as UpdateLeavePolicyInput;
  const policy = await leaveService.updateLeavePolicy(id, body);
  return sendSuccess(res, policy, 'Leave policy updated successfully');
}

// ---------------------------------------------------------------------------
// LeaveBalance
// ---------------------------------------------------------------------------

export async function getMyLeaveBalancesHandler(req: Request, res: Response) {
  const query = req.query as unknown as LeaveBalanceQuery;
  const balances = await leaveService.getMyLeaveBalances(req.user!.sub, query.year);
  return sendSuccess(res, balances);
}

export async function accrueLeaveBalancesHandler(req: Request, res: Response) {
  const body = req.body as AccrueLeaveBalancesInput;
  const result = await leaveService.accrueLeaveBalances(req.user!.sub, body.year);
  return sendSuccess(res, result, `Created ${result.created} leave balance record(s) for ${result.year}`);
}

// ---------------------------------------------------------------------------
// LeaveRequest
// ---------------------------------------------------------------------------

export async function createLeaveRequestHandler(req: Request, res: Response) {
  const body = req.body as CreateLeaveRequestInput;
  const leaveRequest = await leaveService.createLeaveRequest(req.user!.sub, body);
  return sendCreated(res, leaveRequest, 'Leave request submitted successfully');
}

export async function createLeaveRequestAdminHandler(req: Request, res: Response) {
  const body = req.body as CreateLeaveRequestAdminInput;
  const leaveRequest = await leaveService.createLeaveRequestForAdmin(body);
  return sendCreated(res, leaveRequest, 'Leave request submitted on behalf of the employee');
}

export async function listMyLeaveRequestsHandler(req: Request, res: Response) {
  const query = req.query as unknown as LeaveRequestMeQuery;
  const { items, total } = await leaveService.listMyLeaveRequests(req.user!.sub, query);
  return sendPaginated(res, { items, ...buildPagination(total, query.page, query.pageSize) });
}

export async function listAllLeaveRequestsHandler(req: Request, res: Response) {
  const query = req.query as unknown as LeaveRequestAdminQuery;
  const { items, total } = await leaveService.listAllLeaveRequests(req.user!.sub, query);
  return sendPaginated(res, { items, ...buildPagination(total, query.page, query.pageSize) });
}

export async function cancelLeaveRequestHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  const body = req.body as CancelLeaveRequestInput;
  const leaveRequest = await leaveService.cancelLeaveRequest(req.user!.sub, id, body);
  return sendSuccess(res, leaveRequest, 'Leave request cancelled successfully');
}

// ---------------------------------------------------------------------------
// LeaveApproval
// ---------------------------------------------------------------------------

export async function listPendingApprovalsHandler(req: Request, res: Response) {
  const query = req.query as unknown as LeaveApprovalQuery;
  const { items, total } = await leaveService.listPendingApprovals(req.user!.sub, query);
  return sendPaginated(res, { items, ...buildPagination(total, query.page, query.pageSize) });
}

export async function approveLeaveRequestHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  const body = req.body as ApprovalActionInput;
  const result = await leaveService.approveLeaveRequest(id, body);
  return sendSuccess(res, result, 'Leave request approved successfully');
}

export async function rejectLeaveRequestHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  const body = req.body as ApprovalActionInput;
  const result = await leaveService.rejectLeaveRequest(id, body);
  return sendSuccess(res, result, 'Leave request rejected successfully');
}
