import { apiClient } from '../../services/api-client.js';
import type { LeaveBalance } from './types.js';

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
