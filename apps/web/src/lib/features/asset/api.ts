import { apiClient } from '../../services/api-client.js';
import type { AssetAssignment } from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function listMyAssets(): Promise<AssetAssignment[]> {
	const res = await apiClient.get<ApiEnvelope<AssetAssignment[]>>('/assets/me');
	return res.data.data;
}
