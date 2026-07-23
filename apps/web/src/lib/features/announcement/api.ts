import type { PaginatedResult } from '@atyantik/shared-types';
import { apiClient } from '../../services/api-client.js';
import type { Announcement } from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function listAnnouncements(params: { page?: number; pageSize?: number } = {}) {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<Announcement>>>('/announcements', {
		params
	});
	return res.data.data;
}
