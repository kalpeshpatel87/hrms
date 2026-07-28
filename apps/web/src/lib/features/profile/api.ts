import { apiClient } from '../../services/api-client.js';
import type { MyProfile, UpdateMyProfileInput } from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
	message?: string;
}

export async function getMyProfile(): Promise<MyProfile> {
	const res = await apiClient.get<ApiEnvelope<MyProfile>>('/employees/me');
	return res.data.data;
}

export async function updateMyProfile(input: UpdateMyProfileInput): Promise<MyProfile> {
	const res = await apiClient.patch<ApiEnvelope<MyProfile>>('/employees/me', input);
	return res.data.data;
}
