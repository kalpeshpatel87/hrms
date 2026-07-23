import type { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { recordAuditLog } from '../../lib/auditLog.js';
import { buildPagination } from '../../lib/response.js';
import type { CreateExpenseClaimInput, ExpenseClaimQuery, ExpenseDecisionInput } from './expense.validation.js';

async function resolveEmployeeForUser(userId: string) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw ApiError.badRequest('No employee profile is linked to this account');
  return employee;
}

const claimInclude = { items: true } satisfies Prisma.ExpenseClaimInclude;

export async function createExpenseClaim(userId: string, input: CreateExpenseClaimInput) {
  const employee = await resolveEmployeeForUser(userId);
  const totalAmount = input.items.reduce((sum, item) => sum + item.amount, 0);

  const claim = await prisma.expenseClaim.create({
    data: {
      employeeId: employee.id,
      title: input.title,
      currency: input.currency,
      totalAmount,
      items: { create: input.items },
    },
    include: claimInclude,
  });

  await recordAuditLog({ action: 'CREATE', entityType: 'ExpenseClaim', entityId: claim.id, after: claim });
  return claim;
}

export async function submitExpenseClaim(userId: string, claimId: string) {
  const employee = await resolveEmployeeForUser(userId);
  const claim = await prisma.expenseClaim.findFirst({ where: { id: claimId, employeeId: employee.id } });
  if (!claim) throw ApiError.notFound('Expense claim not found');
  if (claim.status !== 'DRAFT') throw ApiError.conflict('Only draft claims can be submitted');

  const updated = await prisma.expenseClaim.update({
    where: { id: claimId },
    data: { status: 'SUBMITTED', submittedAt: new Date() },
    include: claimInclude,
  });
  await recordAuditLog({ action: 'UPDATE', entityType: 'ExpenseClaim', entityId: claimId, after: updated });
  return updated;
}

export async function listMyExpenseClaims(userId: string, query: ExpenseClaimQuery) {
  const employee = await resolveEmployeeForUser(userId);
  const where: Prisma.ExpenseClaimWhereInput = { employeeId: employee.id };
  if (query.status) where.status = query.status;

  const [items, total] = await Promise.all([
    prisma.expenseClaim.findMany({
      where,
      include: claimInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.expenseClaim.count({ where }),
  ]);
  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function listExpenseClaims(query: ExpenseClaimQuery) {
  const where: Prisma.ExpenseClaimWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.employeeId) where.employeeId = query.employeeId;

  const [items, total] = await Promise.all([
    prisma.expenseClaim.findMany({
      where,
      include: claimInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.expenseClaim.count({ where }),
  ]);
  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function decideExpenseClaim(userId: string, claimId: string, input: ExpenseDecisionInput) {
  const claim = await prisma.expenseClaim.findUnique({ where: { id: claimId } });
  if (!claim) throw ApiError.notFound('Expense claim not found');
  if (claim.status !== 'SUBMITTED') throw ApiError.conflict('This claim has already been decided or is still a draft');

  const updated = await prisma.expenseClaim.update({
    where: { id: claimId },
    data: { status: input.status, approvedById: userId, approvedAt: new Date() },
    include: claimInclude,
  });

  await recordAuditLog({
    action: input.status === 'APPROVED' ? 'APPROVE' : 'REJECT',
    entityType: 'ExpenseClaim',
    entityId: claimId,
    before: { status: claim.status },
    after: { status: updated.status },
  });
  return updated;
}
