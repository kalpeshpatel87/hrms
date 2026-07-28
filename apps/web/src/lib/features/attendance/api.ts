import type { PaginatedResult } from '@atyantik/shared-types';
import { apiClient } from '../../services/api-client.js';
import type {
	AttendanceListItem,
	AttendanceQueryParams,
	AttendanceRecord,
	CorrectionRequest,
	UpdateAttendanceInput
} from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function getMyAttendance(month?: number, year?: number): Promise<AttendanceRecord[]> {
	const res = await apiClient.get<ApiEnvelope<AttendanceRecord[]>>('/attendance/me', {
		params: { month, year }
	});
	return res.data.data;
}

export async function checkIn(coords?: { lat: number; lng: number }): Promise<AttendanceRecord> {
	const res = await apiClient.post<ApiEnvelope<AttendanceRecord>>(
		'/attendance/check-in',
		coords ?? {}
	);
	return res.data.data;
}

export async function checkOut(coords?: { lat: number; lng: number }): Promise<AttendanceRecord> {
	const res = await apiClient.post<ApiEnvelope<AttendanceRecord>>(
		'/attendance/check-out',
		coords ?? {}
	);
	return res.data.data;
}

export async function breakIn(breakType?: string): Promise<AttendanceRecord> {
	const res = await apiClient.post<ApiEnvelope<AttendanceRecord>>('/attendance/break-in', {
		breakType
	});
	return res.data.data;
}

export async function breakOut(): Promise<AttendanceRecord> {
	const res = await apiClient.post<ApiEnvelope<AttendanceRecord>>('/attendance/break-out', {});
	return res.data.data;
}

/** Admin-only (requires attendance:approve). */
export async function listAllAttendance(
	params: AttendanceQueryParams
): Promise<PaginatedResult<AttendanceListItem>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<AttendanceListItem>>>('/attendance', {
		params
	});
	return res.data.data;
}

/** Admin-only (requires attendance:update). */
export async function updateAttendanceRecord(
	id: string,
	input: UpdateAttendanceInput
): Promise<AttendanceListItem> {
	const res = await apiClient.patch<ApiEnvelope<AttendanceListItem>>(`/attendance/${id}`, input);
	return res.data.data;
}

/** Admin-only (requires attendance:approve). */
export async function listCorrectionRequests(params: {
	page?: number;
	pageSize?: number;
	status?: string;
	employeeId?: string;
}): Promise<PaginatedResult<CorrectionRequest>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<CorrectionRequest>>>(
		'/attendance/correction-requests',
		{ params }
	);
	return res.data.data;
}

export async function approveCorrectionRequest(id: string): Promise<CorrectionRequest> {
	const res = await apiClient.post<ApiEnvelope<CorrectionRequest>>(
		`/attendance/correction-requests/${id}/approve`
	);
	return res.data.data;
}

export async function rejectCorrectionRequest(id: string): Promise<CorrectionRequest> {
	const res = await apiClient.post<ApiEnvelope<CorrectionRequest>>(
		`/attendance/correction-requests/${id}/reject`
	);
	return res.data.data;
}
