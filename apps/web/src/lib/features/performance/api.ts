import type { PaginatedResult } from '@atyantik/shared-types';
import { apiClient } from '../../services/api-client.js';
import type { CreateGoalInput, Goal, UpdateGoalInput } from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function listMyGoals(params: {
	page?: number;
	pageSize?: number;
}): Promise<PaginatedResult<Goal>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<Goal>>>('/performance/goals/me', {
		params
	});
	return res.data.data;
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
	const res = await apiClient.post<ApiEnvelope<Goal>>('/performance/goals', input);
	return res.data.data;
}

export async function updateGoal(id: string, input: UpdateGoalInput): Promise<Goal> {
	const res = await apiClient.patch<ApiEnvelope<Goal>>(`/performance/goals/${id}`, input);
	return res.data.data;
}
