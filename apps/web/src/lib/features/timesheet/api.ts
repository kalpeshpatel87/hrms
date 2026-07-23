import type { PaginatedResult } from '@atyantik/shared-types';
import { apiClient } from '../../services/api-client.js';
import type { CreateTimesheetInput, Project, Timesheet } from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function listProjects(): Promise<Project[]> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<Project>>>('/timesheets/projects', {
		params: { pageSize: 100 }
	});
	return res.data.data.items;
}

export async function saveTimesheet(input: CreateTimesheetInput): Promise<Timesheet> {
	const res = await apiClient.put<ApiEnvelope<Timesheet>>('/timesheets', input);
	return res.data.data;
}

export async function submitTimesheet(id: string): Promise<Timesheet> {
	const res = await apiClient.post<ApiEnvelope<Timesheet>>(`/timesheets/${id}/submit`);
	return res.data.data;
}

export async function listMyTimesheets(params: {
	page?: number;
	pageSize?: number;
}): Promise<PaginatedResult<Timesheet>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<Timesheet>>>('/timesheets/me', {
		params
	});
	return res.data.data;
}
