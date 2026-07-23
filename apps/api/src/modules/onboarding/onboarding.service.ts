import type { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { recordAuditLog } from '../../lib/auditLog.js';
import type { CreateOnboardingChecklistInput, UpdateOnboardingTaskInput } from './onboarding.validation.js';

const checklistInclude = { tasks: true } satisfies Prisma.OnboardingChecklistInclude;

export async function createChecklist(input: CreateOnboardingChecklistInput) {
  const employee = await prisma.employee.findUnique({ where: { id: input.employeeId } });
  if (!employee) throw ApiError.notFound('Employee not found');

  const existing = await prisma.onboardingChecklist.findUnique({ where: { employeeId: input.employeeId } });
  if (existing) throw ApiError.conflict('An onboarding checklist already exists for this employee');

  const checklist = await prisma.onboardingChecklist.create({
    data: {
      employeeId: input.employeeId,
      templateName: input.templateName,
      tasks: { create: input.taskNames.map((taskName) => ({ taskName })) },
    },
    include: checklistInclude,
  });

  await recordAuditLog({ action: 'CREATE', entityType: 'OnboardingChecklist', entityId: checklist.id, after: checklist });
  return checklist;
}

export async function getChecklistForEmployee(employeeId: string, requester: { sub: string; permissions: string[] }) {
  const canReadAny = requester.permissions.includes('onboarding:read');
  if (!canReadAny) {
    const employee = await prisma.employee.findUnique({ where: { userId: requester.sub } });
    if (!employee || employee.id !== employeeId) throw ApiError.forbidden();
  }

  const checklist = await prisma.onboardingChecklist.findUnique({ where: { employeeId }, include: checklistInclude });
  if (!checklist) throw ApiError.notFound('No onboarding checklist found for this employee');
  return checklist;
}

export async function updateTask(taskId: string, input: UpdateOnboardingTaskInput) {
  const before = await prisma.onboardingTask.findUnique({ where: { id: taskId } });
  if (!before) throw ApiError.notFound('Onboarding task not found');

  const data: Prisma.OnboardingTaskUpdateInput = { ...input };
  if (input.status === 'COMPLETED') data.completedAt = new Date();

  const updated = await prisma.onboardingTask.update({ where: { id: taskId }, data });

  const remaining = await prisma.onboardingTask.count({
    where: { onboardingChecklistId: updated.onboardingChecklistId, status: { notIn: ['COMPLETED', 'SKIPPED'] } },
  });
  if (remaining === 0) {
    await prisma.onboardingChecklist.update({
      where: { id: updated.onboardingChecklistId },
      data: { completedAt: new Date() },
    });
  }

  await recordAuditLog({ action: 'UPDATE', entityType: 'OnboardingTask', entityId: taskId, before, after: updated });
  return updated;
}
