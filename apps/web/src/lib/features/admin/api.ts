import type { PaginatedResult } from '@atyantik/shared-types';
import { apiClient } from '../../services/api-client.js';
import type {
	AuditLogRow,
	Company,
	CompanyUpdateInput,
	CreateDepartmentInput,
	DepartmentRow,
	Permission,
	Role
} from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function listDepartments(params: {
	page?: number;
	pageSize?: number;
	search?: string;
}): Promise<PaginatedResult<DepartmentRow>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<DepartmentRow>>>('/org/departments', {
		params
	});
	return res.data.data;
}

export async function createDepartment(input: CreateDepartmentInput): Promise<DepartmentRow> {
	const res = await apiClient.post<ApiEnvelope<DepartmentRow>>('/org/departments', input);
	return res.data.data;
}

export async function updateDepartment(
	id: string,
	input: Partial<CreateDepartmentInput>
): Promise<DepartmentRow> {
	const res = await apiClient.put<ApiEnvelope<DepartmentRow>>(`/org/departments/${id}`, input);
	return res.data.data;
}

export async function deleteDepartment(id: string): Promise<void> {
	await apiClient.delete(`/org/departments/${id}`);
}

export async function listRoles(): Promise<Role[]> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<Role>>>('/org/roles', {
		params: { pageSize: 50 }
	});
	return res.data.data.items;
}

export async function getRole(id: string): Promise<Role> {
	const res = await apiClient.get<ApiEnvelope<Role>>(`/org/roles/${id}`);
	return res.data.data;
}

export async function listPermissions(): Promise<Permission[]> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<Permission>>>('/org/permissions', {
		params: { pageSize: 200 }
	});
	return res.data.data.items;
}

export async function setRolePermissions(roleId: string, permissionIds: string[]): Promise<Role> {
	const res = await apiClient.put<ApiEnvelope<Role>>(`/org/roles/${roleId}/permissions`, {
		permissionIds
	});
	return res.data.data;
}

export async function getCompany(): Promise<Company> {
	const res = await apiClient.get<ApiEnvelope<Company>>('/org/company');
	return res.data.data;
}

export async function updateCompany(input: CompanyUpdateInput): Promise<Company> {
	const res = await apiClient.put<ApiEnvelope<Company>>('/org/company', input);
	return res.data.data;
}

export async function listAuditLogs(params: {
	page?: number;
	pageSize?: number;
	entityType?: string;
}): Promise<PaginatedResult<AuditLogRow>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<AuditLogRow>>>('/org/audit-logs', {
		params
	});
	return res.data.data;
}
