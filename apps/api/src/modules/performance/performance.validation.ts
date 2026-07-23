import { GoalStatus, ReviewCycleStatus, ReviewerType } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '@atyantik/shared-types';

export const keyResultInputSchema = z.object({
  description: z.string().trim().min(1),
  targetValue: z.coerce.number().optional(),
  actualValue: z.coerce.number().optional(),
  unit: z.string().min(1).optional(),
});
export type KeyResultInput = z.infer<typeof keyResultInputSchema>;

export const createGoalSchema = z.object({
  employeeId: z.string().min(1).optional(),
  title: z.string().trim().min(1),
  description: z.string().min(1).optional(),
  startDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  weightPercent: z.coerce.number().min(0).max(100).default(0),
  reviewCycleId: z.string().min(1).optional(),
  keyResults: z.array(keyResultInputSchema).default([]),
});
export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.nativeEnum(GoalStatus).optional(),
  progressPercent: z.coerce.number().int().min(0).max(100).optional(),
  weightPercent: z.coerce.number().min(0).max(100).optional(),
});
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

export const goalQuerySchema = paginationQuerySchema.extend({
  employeeId: z.string().min(1).optional(),
  status: z.nativeEnum(GoalStatus).optional(),
});
export type GoalQuery = z.infer<typeof goalQuerySchema>;

export const createReviewSchema = z.object({
  employeeId: z.string().min(1),
  cycleName: z.string().trim().min(1),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const reviewQuerySchema = paginationQuerySchema.extend({
  employeeId: z.string().min(1).optional(),
  status: z.nativeEnum(ReviewCycleStatus).optional(),
});
export type ReviewQuery = z.infer<typeof reviewQuerySchema>;

export const addReviewerSchema = z.object({
  reviewerId: z.string().min(1),
  reviewerType: z.nativeEnum(ReviewerType),
});
export type AddReviewerInput = z.infer<typeof addReviewerSchema>;

export const submitFeedbackSchema = z.object({
  competency: z.string().trim().min(1),
  rating: z.coerce.number().min(0).max(5),
  comments: z.string().min(1).optional(),
});
export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
