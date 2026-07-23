import type { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { recordAuditLog } from '../../lib/auditLog.js';
import { buildPagination } from '../../lib/response.js';
import type {
  CreateExitInterviewInput,
  CreateResignationInput,
  ResignationQuery,
  UpdateExitTaskInput,
} from './exit.validation.js';

const DEFAULT_CHECKLIST_TASKS = [
  'Return company assets',
  'Complete knowledge transfer',
  'Revoke IT/system access',
  'Finance clearance',
  'HR exit interview',
];

async function resolveEmployeeForUser(userId: string) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw ApiError.badRequest('No employee profile is linked to this account');
  return employee;
}

const resignationInclude = {
  employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
  exitChecklist: { include: { tasks: true } },
  exitInterview: true,
} satisfies Prisma.ResignationInclude;

export async function createResignation(userId: string, input: CreateResignationInput) {
  const employee = await resolveEmployeeForUser(userId);
  const resignation = await prisma.resignation.create({
    data: { ...input, employeeId: employee.id },
    include: resignationInclude,
  });
  await recordAuditLog({ action: 'CREATE', entityType: 'Resignation', entityId: resignation.id, after: resignation });
  return resignation;
}

export async function listMyResignations(userId: string, query: ResignationQuery) {
  const employee = await resolveEmployeeForUser(userId);
  const [items, total] = await Promise.all([
    prisma.resignation.findMany({
      where: { employeeId: employee.id },
      include: resignationInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.resignation.count({ where: { employeeId: employee.id } }),
  ]);
  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function listResignations(query: ResignationQuery) {
  const [items, total] = await Promise.all([
    prisma.resignation.findMany({
      include: resignationInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.resignation.count(),
  ]);
  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function decideResignation(userId: string, id: string, approve: boolean) {
  const resignation = await prisma.resignation.findUnique({ where: { id } });
  if (!resignation) throw ApiError.notFound('Resignation not found');
  if (resignation.status !== 'SUBMITTED') throw ApiError.conflict('This resignation has already been decided');

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.resignation.update({
      where: { id },
      data: {
        status: approve ? 'ACCEPTED' : 'REJECTED',
        approvedById: userId,
        approvedAt: new Date(),
      },
      include: resignationInclude,
    });

    if (approve) {
      await tx.employee.update({
        where: { id: resignation.employeeId },
        data: { status: 'NOTICE_PERIOD', dateOfExit: resignation.lastWorkingDate },
      });
      await tx.exitChecklist.create({
        data: {
          resignationId: id,
          tasks: { create: DEFAULT_CHECKLIST_TASKS.map((taskName) => ({ taskName })) },
        },
      });
    }

    return result;
  });

  await recordAuditLog({
    action: approve ? 'APPROVE' : 'REJECT',
    entityType: 'Resignation',
    entityId: id,
    before: { status: resignation.status },
    after: { status: updated.status },
  });
  return updated;
}

export async function updateExitTask(taskId: string, input: UpdateExitTaskInput) {
  const before = await prisma.exitChecklistTask.findUnique({ where: { id: taskId } });
  if (!before) throw ApiError.notFound('Exit checklist task not found');

  const data: Prisma.ExitChecklistTaskUpdateInput = { ...input };
  if (input.status === 'COMPLETED') data.completedAt = new Date();

  const updated = await prisma.exitChecklistTask.update({ where: { id: taskId }, data });

  await recordAuditLog({ action: 'UPDATE', entityType: 'ExitChecklistTask', entityId: taskId, before, after: updated });
  return updated;
}

export async function createExitInterview(resignationId: string, conductedById: string, input: CreateExitInterviewInput) {
  const resignation = await prisma.resignation.findUnique({ where: { id: resignationId } });
  if (!resignation) throw ApiError.notFound('Resignation not found');

  const interview = await prisma.exitInterview.create({
    data: { resignationId, conductedById, ...input },
  });
  await recordAuditLog({ action: 'CREATE', entityType: 'ExitInterview', entityId: interview.id, after: interview });
  return interview;
}
