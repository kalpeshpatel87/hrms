import type { PaginatedResult } from '@atyantik/shared-types';
import { apiClient } from '../../services/api-client.js';
import type { Course, Enrollment } from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function listCourses(params: {
	page?: number;
	pageSize?: number;
}): Promise<PaginatedResult<Course>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<Course>>>('/learning/courses', {
		params
	});
	return res.data.data;
}

export async function enrollInCourse(courseId: string): Promise<Enrollment> {
	const res = await apiClient.post<ApiEnvelope<Enrollment>>(`/learning/courses/${courseId}/enroll`);
	return res.data.data;
}

export async function listMyEnrollments(params: {
	page?: number;
	pageSize?: number;
}): Promise<PaginatedResult<Enrollment>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<Enrollment>>>(
		'/learning/enrollments/me',
		{ params }
	);
	return res.data.data;
}
