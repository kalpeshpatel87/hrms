import type { PaginatedResult } from '@atyantik/shared-types';
import { apiClient } from '../../services/api-client.js';
import type { CreateResignationInput, Resignation } from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function createResignation(input: CreateResignationInput): Promise<Resignation> {
	const res = await apiClient.post<ApiEnvelope<Resignation>>('/exit/resignations', input);
	return res.data.data;
}

export async function listMyResignations(params: {
	page?: number;
	pageSize?: number;
}): Promise<PaginatedResult<Resignation>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<Resignation>>>(
		'/exit/resignations/me',
		{ params }
	);
	return res.data.data;
}
