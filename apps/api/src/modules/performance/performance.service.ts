import type { Prisma } from '@prisma/client';
import { prisma, softDelete } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { recordAuditLog } from '../../lib/auditLog.js';
import { buildPagination } from '../../lib/response.js';
import type {
  AddReviewerInput,
  CreateGoalInput,
  CreateReviewInput,
  GoalQuery,
  ReviewQuery,
  SubmitFeedbackInput,
  UpdateGoalInput,
} from './performance.validation.js';

async function resolveEmployeeForUser(userId: string) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw ApiError.badRequest('No employee profile is linked to this account');
  return employee;
}

// ---------------------------------------------------------------------------
// Goal
// ---------------------------------------------------------------------------

const goalInclude = { keyResults: true } satisfies Prisma.GoalInclude;

export async function createGoal(userId: string, input: CreateGoalInput) {
  const employeeId = input.employeeId ?? (await resolveEmployeeForUser(userId)).id;

  const goal = await prisma.goal.create({
    data: {
      employeeId,
      title: input.title,
      description: input.description,
      startDate: input.startDate,
      dueDate: input.dueDate,
      weightPercent: input.weightPercent,
      reviewCycleId: input.reviewCycleId,
      keyResults: { create: input.keyResults },
    },
    include: goalInclude,
  });

  await recordAuditLog({ action: 'CREATE', entityType: 'Goal', entityId: goal.id, after: goal });
  return goal;
}

export async function listGoals(query: GoalQuery) {
  const where: Prisma.GoalWhereInput = {};
  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.status) where.status = query.status;

  const [items, total] = await Promise.all([
    prisma.goal.findMany({
      where,
      include: goalInclude,
      orderBy: { dueDate: 'asc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.goal.count({ where }),
  ]);
  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function listMyGoals(userId: string, query: GoalQuery) {
  const employee = await resolveEmployeeForUser(userId);
  return listGoals({ ...query, employeeId: employee.id });
}

export async function updateGoal(id: string, input: UpdateGoalInput) {
  const before = await prisma.goal.findUnique({ where: { id } });
  if (!before) throw ApiError.notFound('Goal not found');
  const updated = await prisma.goal.update({ where: { id }, data: input, include: goalInclude });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Goal', entityId: id, before, after: updated });
  return updated;
}

export async function deleteGoal(id: string) {
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) throw ApiError.notFound('Goal not found');
  await softDelete('Goal', id);
  await recordAuditLog({ action: 'DELETE', entityType: 'Goal', entityId: id, before: goal });
}

// ---------------------------------------------------------------------------
// PerformanceReview
// ---------------------------------------------------------------------------

const reviewInclude = {
  goals: { include: { keyResults: true } },
  reviewerAssignments: { include: { reviewer: { select: { id: true, email: true } }, feedback: true } },
} satisfies Prisma.PerformanceReviewInclude;

export async function createReview(input: CreateReviewInput) {
  const review = await prisma.performanceReview.create({ data: input, include: reviewInclude });
  await recordAuditLog({ action: 'CREATE', entityType: 'PerformanceReview', entityId: review.id, after: review });
  return review;
}

export async function listReviews(query: ReviewQuery) {
  const where: Prisma.PerformanceReviewWhereInput = {};
  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.status) where.status = query.status;

  const [items, total] = await Promise.all([
    prisma.performanceReview.findMany({
      where,
      include: reviewInclude,
      orderBy: { periodStart: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.performanceReview.count({ where }),
  ]);
  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function listMyReviews(userId: string) {
  const employee = await resolveEmployeeForUser(userId);
  return prisma.performanceReview.findMany({
    where: { OR: [{ employeeId: employee.id }, { reviewerAssignments: { some: { reviewerId: userId } } }] },
    include: reviewInclude,
    orderBy: { periodStart: 'desc' },
  });
}

export async function addReviewer(reviewId: string, input: AddReviewerInput) {
  const review = await prisma.performanceReview.findUnique({ where: { id: reviewId } });
  if (!review) throw ApiError.notFound('Performance review not found');

  const assignment = await prisma.reviewerAssignment.create({
    data: { performanceReviewId: reviewId, reviewerId: input.reviewerId, reviewerType: input.reviewerType },
  });
  await recordAuditLog({ action: 'CREATE', entityType: 'ReviewerAssignment', entityId: assignment.id, after: assignment });
  return assignment;
}

export async function submitFeedback(reviewId: string, reviewerId: string, input: SubmitFeedbackInput) {
  const assignment = await prisma.reviewerAssignment.findFirst({
    where: { performanceReviewId: reviewId, reviewerId },
  });
  if (!assignment) throw ApiError.forbidden('You are not a reviewer on this performance review');

  const feedback = await prisma.reviewFeedback.create({
    data: { performanceReviewId: reviewId, reviewerAssignmentId: assignment.id, ...input },
  });
  await prisma.reviewerAssignment.update({ where: { id: assignment.id }, data: { isCompleted: true } });

  await recordAuditLog({ action: 'CREATE', entityType: 'ReviewFeedback', entityId: feedback.id, after: feedback });
  return feedback;
}
