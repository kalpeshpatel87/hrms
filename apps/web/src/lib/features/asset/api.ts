import type { PaginatedResult } from '@atyantik/shared-types';
import { apiClient } from '../../services/api-client.js';
import type { AssetAssignment, AssetRow, AssignAssetInput, CreateAssetInput } from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function listMyAssets(): Promise<AssetAssignment[]> {
	const res = await apiClient.get<ApiEnvelope<AssetAssignment[]>>('/assets/me');
	return res.data.data;
}

export async function listAssets(params: {
	page?: number;
	pageSize?: number;
	search?: string;
}): Promise<PaginatedResult<AssetRow>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<AssetRow>>>('/assets', { params });
	return res.data.data;
}

export async function createAsset(input: CreateAssetInput): Promise<AssetRow> {
	const res = await apiClient.post<ApiEnvelope<AssetRow>>('/assets', input);
	return res.data.data;
}

export async function deleteAsset(id: string): Promise<void> {
	await apiClient.delete(`/assets/${id}`);
}

export async function assignAsset(
	assetId: string,
	input: AssignAssetInput
): Promise<AssetAssignment> {
	const res = await apiClient.post<ApiEnvelope<AssetAssignment>>(
		`/assets/${assetId}/assign`,
		input
	);
	return res.data.data;
}

export async function returnAsset(assignmentId: string, conditionAtReturn: string): Promise<void> {
	await apiClient.post(`/assets/assignments/${assignmentId}/return`, { conditionAtReturn });
}
