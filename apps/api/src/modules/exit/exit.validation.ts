import { ExitTaskStatus } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '@atyantik/shared-types';

export const createResignationSchema = z.object({
  resignationDate: z.coerce.date(),
  lastWorkingDate: z.coerce.date(),
  reason: z.string().min(1).optional(),
});
export type CreateResignationInput = z.infer<typeof createResignationSchema>;

export const resignationQuerySchema = paginationQuerySchema;
export type ResignationQuery = z.infer<typeof resignationQuerySchema>;

export const updateExitTaskSchema = z.object({
  status: z.nativeEnum(ExitTaskStatus).optional(),
  assignedToId: z.string().min(1).optional(),
  dueDate: z.coerce.date().optional(),
});
export type UpdateExitTaskInput = z.infer<typeof updateExitTaskSchema>;

export const createExitInterviewSchema = z.object({
  scheduledAt: z.coerce.date().optional(),
  feedback: z.string().min(1).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
});
export type CreateExitInterviewInput = z.infer<typeof createExitInterviewSchema>;
