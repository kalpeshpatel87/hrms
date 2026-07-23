import type { PaginatedResult } from '@atyantik/shared-types';
import { apiClient } from '../../services/api-client.js';
import type { CreateExpenseClaimInput, ExpenseClaim } from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function createExpenseClaim(input: CreateExpenseClaimInput): Promise<ExpenseClaim> {
	const res = await apiClient.post<ApiEnvelope<ExpenseClaim>>('/expenses/claims', input);
	return res.data.data;
}

export async function submitExpenseClaim(id: string): Promise<ExpenseClaim> {
	const res = await apiClient.post<ApiEnvelope<ExpenseClaim>>(`/expenses/claims/${id}/submit`);
	return res.data.data;
}

export async function listMyExpenseClaims(params: {
	page?: number;
	pageSize?: number;
}): Promise<PaginatedResult<ExpenseClaim>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<ExpenseClaim>>>(
		'/expenses/claims/me',
		{ params }
	);
	return res.data.data;
}
