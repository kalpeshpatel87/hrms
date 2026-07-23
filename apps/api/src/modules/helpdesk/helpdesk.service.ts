import type { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { recordAuditLog } from '../../lib/auditLog.js';
import { buildPagination } from '../../lib/response.js';
import type {
  CreateTicketCommentInput,
  CreateTicketInput,
  TicketQuery,
  UpdateTicketInput,
} from './helpdesk.validation.js';

async function resolveEmployeeForUser(userId: string) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw ApiError.badRequest('No employee profile is linked to this account');
  return employee;
}

async function generateTicketNumber(): Promise<string> {
  const total = await prisma.ticket.count();
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = `TCK-${String(total + 1 + attempt).padStart(5, '0')}`;
    const exists = await prisma.ticket.findUnique({ where: { ticketNumber: candidate } });
    if (!exists) return candidate;
  }
  throw ApiError.internal('Failed to generate a unique ticket number');
}

const ticketInclude = {
  raisedBy: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
  assignedTo: { select: { id: true, email: true } },
} satisfies Prisma.TicketInclude;

export async function createTicket(userId: string, input: CreateTicketInput) {
  const employee = await resolveEmployeeForUser(userId);
  const ticketNumber = await generateTicketNumber();

  const ticket = await prisma.ticket.create({
    data: { ...input, ticketNumber, raisedById: employee.id },
    include: ticketInclude,
  });

  await recordAuditLog({ action: 'CREATE', entityType: 'Ticket', entityId: ticket.id, after: ticket });
  return ticket;
}

export async function listMyTickets(userId: string, query: TicketQuery) {
  const employee = await resolveEmployeeForUser(userId);
  const where: Prisma.TicketWhereInput = { raisedById: employee.id };
  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.category) where.category = query.category;

  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: ticketInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.ticket.count({ where }),
  ]);
  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function listTickets(query: TicketQuery) {
  const where: Prisma.TicketWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.category) where.category = query.category;
  if (query.assignedToId) where.assignedToId = query.assignedToId;
  if (query.search) {
    where.OR = [
      { subject: { contains: query.search, mode: 'insensitive' } },
      { ticketNumber: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: ticketInclude,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.ticket.count({ where }),
  ]);
  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function getTicketOrThrow(id: string, requester: { sub: string; permissions: string[] }) {
  const ticket = await prisma.ticket.findUnique({ where: { id }, include: ticketInclude });
  if (!ticket) throw ApiError.notFound('Ticket not found');

  const canReadAny = requester.permissions.includes('helpdesk:read');
  if (!canReadAny) {
    const employee = await resolveEmployeeForUser(requester.sub);
    if (ticket.raisedById !== employee.id && ticket.assignedToId !== requester.sub) {
      throw ApiError.forbidden();
    }
  }
  return ticket;
}

export async function updateTicket(id: string, input: UpdateTicketInput) {
  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Ticket not found');

  const data: Prisma.TicketUpdateInput = { ...input };
  if (input.status === 'RESOLVED' || input.status === 'CLOSED') {
    data.resolvedAt = new Date();
  }

  const updated = await prisma.ticket.update({ where: { id }, data, include: ticketInclude });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Ticket', entityId: id, before: existing, after: updated });
  return updated;
}

export async function listComments(ticketId: string, requester: { sub: string; permissions: string[] }) {
  await getTicketOrThrow(ticketId, requester);
  const canReadAny = requester.permissions.includes('helpdesk:read');

  const comments = await prisma.ticketComment.findMany({
    where: { ticketId, ...(canReadAny ? {} : { isInternal: false }) },
    include: { author: { select: { id: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return comments;
}

export async function addComment(
  ticketId: string,
  authorId: string,
  input: CreateTicketCommentInput,
  requester: { sub: string; permissions: string[] },
) {
  await getTicketOrThrow(ticketId, requester);

  const comment = await prisma.ticketComment.create({
    data: { ticketId, authorId, ...input },
    include: { author: { select: { id: true, email: true } } },
  });
  await recordAuditLog({ action: 'CREATE', entityType: 'TicketComment', entityId: comment.id, after: comment });
  return comment;
}
