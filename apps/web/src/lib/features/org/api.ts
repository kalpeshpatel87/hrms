import type { PaginatedResult } from '@atyantik/shared-types';
import { apiClient } from '../../services/api-client.js';
import type { Branch, Department, Designation } from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function listAllDepartments(): Promise<Department[]> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<Department>>>('/org/departments', {
		params: { pageSize: 100 }
	});
	return res.data.data.items;
}

export async function listAllDesignations(): Promise<Designation[]> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<Designation>>>('/org/designations', {
		params: { pageSize: 100 }
	});
	return res.data.data.items;
}

export async function listAllBranches(): Promise<Branch[]> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<Branch>>>('/org/branches', {
		params: { pageSize: 100 }
	});
	return res.data.data.items;
}
