import type { PaginatedResult } from '@atyantik/shared-types';
import { apiClient } from '../../services/api-client.js';
import type { Notification } from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function listMyNotifications(params: {
	page?: number;
	pageSize?: number;
	isRead?: boolean;
}): Promise<PaginatedResult<Notification>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<Notification>>>('/notifications/me', {
		params
	});
	return res.data.data;
}

export async function getUnreadCount(): Promise<number> {
	const res = await apiClient.get<ApiEnvelope<{ count: number }>>('/notifications/me/unread-count');
	return res.data.data.count;
}

export async function markAsRead(id: string): Promise<void> {
	await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
	await apiClient.post('/notifications/me/read-all');
}
