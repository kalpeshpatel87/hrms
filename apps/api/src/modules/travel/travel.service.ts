import type { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { recordAuditLog } from '../../lib/auditLog.js';
import { buildPagination } from '../../lib/response.js';
import type { CreateTravelRequestInput, TravelDecisionInput, TravelQuery } from './travel.validation.js';

async function resolveEmployeeForUser(userId: string) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw ApiError.badRequest('No employee profile is linked to this account');
  return employee;
}

export async function createTravelRequest(userId: string, input: CreateTravelRequestInput) {
  const employee = await resolveEmployeeForUser(userId);
  const request = await prisma.travelRequest.create({ data: { ...input, employeeId: employee.id } });
  await recordAuditLog({ action: 'CREATE', entityType: 'TravelRequest', entityId: request.id, after: request });
  return request;
}

export async function listMyTravelRequests(userId: string, query: TravelQuery) {
  const employee = await resolveEmployeeForUser(userId);
  const where: Prisma.TravelRequestWhereInput = { employeeId: employee.id };
  if (query.status) where.status = query.status;

  const [items, total] = await Promise.all([
    prisma.travelRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.travelRequest.count({ where }),
  ]);
  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function listTravelRequests(query: TravelQuery) {
  const where: Prisma.TravelRequestWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.employeeId) where.employeeId = query.employeeId;

  const [items, total] = await Promise.all([
    prisma.travelRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.travelRequest.count({ where }),
  ]);
  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function decideTravelRequest(userId: string, id: string, input: TravelDecisionInput) {
  const request = await prisma.travelRequest.findUnique({ where: { id } });
  if (!request) throw ApiError.notFound('Travel request not found');
  if (request.status !== 'PENDING') throw ApiError.conflict('This travel request has already been decided');

  const updated = await prisma.travelRequest.update({
    where: { id },
    data: { status: input.status, approvedById: userId, approvedAt: new Date() },
  });

  await recordAuditLog({
    action: input.status === 'APPROVED' ? 'APPROVE' : 'REJECT',
    entityType: 'TravelRequest',
    entityId: id,
    before: { status: request.status },
    after: { status: updated.status },
  });
  return updated;
}
