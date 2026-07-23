import type { PaginatedResult } from '@atyantik/shared-types';
import { apiClient } from '../../services/api-client.js';
import type { DocumentCategory, DocumentRow } from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function listMyDocuments(params: {
	page?: number;
	pageSize?: number;
}): Promise<PaginatedResult<DocumentRow>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<DocumentRow>>>('/documents/me', {
		params
	});
	return res.data.data;
}

export async function uploadDocument(
	file: File,
	meta: { title: string; category: DocumentCategory; isConfidential?: boolean }
): Promise<DocumentRow> {
	const formData = new FormData();
	formData.append('file', file);
	formData.append('title', meta.title);
	formData.append('category', meta.category);
	formData.append('isConfidential', String(meta.isConfidential ?? false));

	const res = await apiClient.post<ApiEnvelope<DocumentRow>>('/documents', formData, {
		headers: { 'Content-Type': 'multipart/form-data' }
	});
	return res.data.data;
}

export async function downloadDocument(id: string): Promise<Blob> {
	// The API validates auth/ownership then 302-redirects to the (public)
	// static file URL — axios follows redirects for GET by default, so this
	// still needs the Bearer token on the *first* request, which a plain
	// <a href> navigation can't send.
	const res = await apiClient.get(`/documents/${id}/download`, { responseType: 'blob' });
	return res.data as Blob;
}
