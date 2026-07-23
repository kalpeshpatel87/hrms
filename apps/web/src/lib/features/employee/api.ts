import type { PaginatedResult } from '@atyantik/shared-types';
import { apiClient } from '../../services/api-client.js';
import type {
	CreateEmployeeInput,
	EmployeeListItem,
	EmployeeQueryParams,
	UpdateEmployeeInput
} from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
	message?: string;
}

export async function listEmployees(
	params: EmployeeQueryParams
): Promise<PaginatedResult<EmployeeListItem>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<EmployeeListItem>>>('/employees', {
		params
	});
	return res.data.data;
}

export async function getEmployee(id: string) {
	const res = await apiClient.get<ApiEnvelope<EmployeeListItem & Record<string, unknown>>>(
		`/employees/${id}`
	);
	return res.data.data;
}

export async function getMyEmployeeProfile() {
	const res =
		await apiClient.get<ApiEnvelope<EmployeeListItem & Record<string, unknown>>>('/employees/me');
	return res.data.data;
}

export async function createEmployee(input: CreateEmployeeInput) {
	const res = await apiClient.post<ApiEnvelope<EmployeeListItem & { temporaryPassword?: string }>>(
		'/employees',
		input
	);
	return res.data.data;
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput) {
	const res = await apiClient.patch<ApiEnvelope<EmployeeListItem>>(`/employees/${id}`, input);
	return res.data.data;
}

export async function deleteEmployee(id: string): Promise<void> {
	await apiClient.delete(`/employees/${id}`);
}
