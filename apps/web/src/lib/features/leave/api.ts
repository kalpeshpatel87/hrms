import type { PaginatedResult } from '@atyantik/shared-types';
import { apiClient } from '../../services/api-client.js';
import type {
	AdjustLeaveBalanceInput,
	CreateLeaveRequestAdminInput,
	CreateLeaveRequestInput,
	LeaveApproval,
	LeaveBalance,
	LeaveRequest,
	LeaveType
} from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function getMyLeaveBalances(year?: number): Promise<LeaveBalance[]> {
	const res = await apiClient.get<ApiEnvelope<LeaveBalance[]>>('/leave/balances/me', {
		params: { year }
	});
	return res.data.data;
}

/** Admin-only (requires leave:update): view any employee's leave balances. */
export async function listEmployeeLeaveBalances(
	employeeId: string,
	year?: number
): Promise<LeaveBalance[]> {
	const res = await apiClient.get<ApiEnvelope<LeaveBalance[]>>('/leave/balances', {
		params: { employeeId, year }
	});
	return res.data.data;
}

/** Admin-only (requires leave:update): add (positive) or remove (negative) days from a balance. */
export async function adjustLeaveBalance(input: AdjustLeaveBalanceInput): Promise<LeaveBalance> {
	const res = await apiClient.post<ApiEnvelope<LeaveBalance>>('/leave/balances/adjust', input);
	return res.data.data;
}

export async function listLeaveTypes(): Promise<LeaveType[]> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<LeaveType>>>('/leave/types', {
		params: { pageSize: 100 }
	});
	return res.data.data.items;
}

export async function createLeaveRequest(input: CreateLeaveRequestInput): Promise<LeaveRequest> {
	const res = await apiClient.post<ApiEnvelope<LeaveRequest>>('/leave/requests', input);
	return res.data.data;
}

/** Admin-only: apply leave on behalf of any employee (requires leave:create). */
export async function createLeaveRequestForAdmin(
	input: CreateLeaveRequestAdminInput
): Promise<LeaveRequest> {
	const res = await apiClient.post<ApiEnvelope<LeaveRequest>>('/leave/requests/admin', input);
	return res.data.data;
}

export async function listMyLeaveRequests(params: {
	page?: number;
	pageSize?: number;
	status?: string;
}): Promise<PaginatedResult<LeaveRequest>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<LeaveRequest>>>(
		'/leave/requests/me',
		{ params }
	);
	return res.data.data;
}

export async function cancelLeaveRequest(id: string, cancelReason?: string): Promise<LeaveRequest> {
	const res = await apiClient.post<ApiEnvelope<LeaveRequest>>(`/leave/requests/${id}/cancel`, {
		cancelReason
	});
	return res.data.data;
}

export async function listPendingApprovals(params: {
	page?: number;
	pageSize?: number;
}): Promise<PaginatedResult<LeaveApproval>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<LeaveApproval>>>(
		'/leave/approvals/pending',
		{ params }
	);
	return res.data.data;
}

export async function approveLeaveRequest(
	approvalId: string,
	comments?: string
): Promise<LeaveApproval> {
	const res = await apiClient.post<ApiEnvelope<LeaveApproval>>(
		`/leave/approvals/${approvalId}/approve`,
		{ comments }
	);
	return res.data.data;
}

export async function rejectLeaveRequest(
	approvalId: string,
	comments?: string
): Promise<LeaveApproval> {
	const res = await apiClient.post<ApiEnvelope<LeaveApproval>>(
		`/leave/approvals/${approvalId}/reject`,
		{ comments }
	);
	return res.data.data;
}
