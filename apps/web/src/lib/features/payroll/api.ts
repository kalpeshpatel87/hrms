import type { PaginatedResult } from '@atyantik/shared-types';
import { apiClient } from '../../services/api-client.js';
import type { PayrollRun, Payslip } from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function listMyPayslips(params: {
	page?: number;
	pageSize?: number;
}): Promise<PaginatedResult<Payslip>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<Payslip>>>('/payroll/payslips/me', {
		params
	});
	return res.data.data;
}

export async function downloadPayslip(id: string): Promise<Blob> {
	const res = await apiClient.get(`/payroll/payslips/${id}/download`, { responseType: 'blob' });
	return res.data as Blob;
}

export async function listPayrollRuns(params: {
	page?: number;
	pageSize?: number;
}): Promise<PaginatedResult<PayrollRun>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<PayrollRun>>>('/payroll/runs', {
		params
	});
	return res.data.data;
}

export async function generatePayrollRun(month: number, year: number): Promise<PayrollRun> {
	const res = await apiClient.post<ApiEnvelope<PayrollRun>>('/payroll/runs', { month, year });
	return res.data.data;
}

export async function approvePayrollRun(id: string): Promise<PayrollRun> {
	const res = await apiClient.post<ApiEnvelope<PayrollRun>>(`/payroll/runs/${id}/approve`);
	return res.data.data;
}
