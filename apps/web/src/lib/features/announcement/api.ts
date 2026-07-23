import type { PaginatedResult } from '@atyantik/shared-types';
import { apiClient } from '../../services/api-client.js';
import type { Announcement } from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export interface CreateAnnouncementInput {
	title: string;
	body: string;
	audience?: string;
	isPinned?: boolean;
	publishAt?: string;
	expiresAt?: string;
}

export async function listAnnouncements(params: { page?: number; pageSize?: number } = {}) {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<Announcement>>>('/announcements', {
		params
	});
	return res.data.data;
}

export async function createAnnouncement(input: CreateAnnouncementInput): Promise<Announcement> {
	const res = await apiClient.post<ApiEnvelope<Announcement>>('/announcements', input);
	return res.data.data;
}

export async function deleteAnnouncement(id: string): Promise<void> {
	await apiClient.delete(`/announcements/${id}`);
}
