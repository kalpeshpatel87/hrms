import type { PaginatedResult } from '@atyantik/shared-types';
import { apiClient } from '../../services/api-client.js';
import type { CreateTicketInput, Ticket, TicketComment } from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
	const res = await apiClient.post<ApiEnvelope<Ticket>>('/helpdesk/tickets', input);
	return res.data.data;
}

export async function listMyTickets(params: {
	page?: number;
	pageSize?: number;
}): Promise<PaginatedResult<Ticket>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<Ticket>>>('/helpdesk/tickets/me', {
		params
	});
	return res.data.data;
}

export async function getTicket(id: string): Promise<Ticket> {
	const res = await apiClient.get<ApiEnvelope<Ticket>>(`/helpdesk/tickets/${id}`);
	return res.data.data;
}

export async function listComments(id: string): Promise<TicketComment[]> {
	const res = await apiClient.get<ApiEnvelope<TicketComment[]>>(`/helpdesk/tickets/${id}/comments`);
	return res.data.data;
}

export async function addComment(id: string, body: string): Promise<TicketComment> {
	const res = await apiClient.post<ApiEnvelope<TicketComment>>(`/helpdesk/tickets/${id}/comments`, {
		body
	});
	return res.data.data;
}
