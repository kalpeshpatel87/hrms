import type { PaginatedResult } from '@atyantik/shared-types';
import { apiClient } from '../../services/api-client.js';
import type { CreateTravelRequestInput, TravelRequest } from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function createTravelRequest(input: CreateTravelRequestInput): Promise<TravelRequest> {
	const res = await apiClient.post<ApiEnvelope<TravelRequest>>('/travel/requests', input);
	return res.data.data;
}

export async function listMyTravelRequests(params: {
	page?: number;
	pageSize?: number;
}): Promise<PaginatedResult<TravelRequest>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<TravelRequest>>>(
		'/travel/requests/me',
		{ params }
	);
	return res.data.data;
}
