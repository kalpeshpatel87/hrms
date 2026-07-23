export type TicketCategory = 'IT' | 'HR' | 'FINANCE' | 'ADMIN' | 'FACILITIES' | 'OTHER';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED' | 'CLOSED' | 'REOPENED';

export interface Ticket {
	id: string;
	ticketNumber: string;
	category: TicketCategory;
	priority: TicketPriority;
	subject: string;
	description: string | null;
	status: TicketStatus;
	resolvedAt: string | null;
	createdAt: string;
	raisedBy?: { id: string; firstName: string; lastName: string; employeeCode: string };
	assignedTo?: { id: string; email: string } | null;
}

export interface TicketComment {
	id: string;
	body: string;
	isInternal: boolean;
	createdAt: string;
	author: { id: string; email: string };
}

export interface CreateTicketInput {
	category: TicketCategory;
	priority: TicketPriority;
	subject: string;
	description?: string;
}
