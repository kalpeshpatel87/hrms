import { apiClient } from '../../services/api-client.js';
import type { AttendanceRecord } from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function getMyAttendance(month?: number, year?: number): Promise<AttendanceRecord[]> {
	const res = await apiClient.get<ApiEnvelope<AttendanceRecord[]>>('/attendance/me', {
		params: { month, year }
	});
	return res.data.data;
}

export async function checkIn(coords?: { lat: number; lng: number }): Promise<AttendanceRecord> {
	const res = await apiClient.post<ApiEnvelope<AttendanceRecord>>(
		'/attendance/check-in',
		coords ?? {}
	);
	return res.data.data;
}

export async function checkOut(coords?: { lat: number; lng: number }): Promise<AttendanceRecord> {
	const res = await apiClient.post<ApiEnvelope<AttendanceRecord>>(
		'/attendance/check-out',
		coords ?? {}
	);
	return res.data.data;
}

export async function breakIn(breakType?: string): Promise<AttendanceRecord> {
	const res = await apiClient.post<ApiEnvelope<AttendanceRecord>>('/attendance/break-in', {
		breakType
	});
	return res.data.data;
}

export async function breakOut(): Promise<AttendanceRecord> {
	const res = await apiClient.post<ApiEnvelope<AttendanceRecord>>('/attendance/break-out', {});
	return res.data.data;
}
