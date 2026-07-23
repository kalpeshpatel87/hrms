import { apiClient } from '../../services/api-client.js';
import type {
	AttendanceSummaryRow,
	HeadcountByDepartment,
	LeaveSummaryRow,
	PayrollSummaryRow
} from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function getHeadcountByDepartment(): Promise<HeadcountByDepartment[]> {
	const res = await apiClient.get<ApiEnvelope<HeadcountByDepartment[]>>(
		'/reports/headcount-by-department'
	);
	return res.data.data;
}

export async function getAttendanceSummary(
	month: number,
	year: number
): Promise<AttendanceSummaryRow[]> {
	const res = await apiClient.get<ApiEnvelope<AttendanceSummaryRow[]>>('/reports/attendance-summary', {
		params: { month, year }
	});
	return res.data.data;
}

export async function getLeaveSummary(year: number): Promise<LeaveSummaryRow[]> {
	const res = await apiClient.get<ApiEnvelope<LeaveSummaryRow[]>>('/reports/leave-summary', {
		params: { year }
	});
	return res.data.data;
}

export async function getPayrollSummary(year: number): Promise<PayrollSummaryRow[]> {
	const res = await apiClient.get<ApiEnvelope<PayrollSummaryRow[]>>('/reports/payroll-summary', {
		params: { year }
	});
	return res.data.data;
}
