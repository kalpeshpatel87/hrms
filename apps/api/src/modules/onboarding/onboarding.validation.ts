import { OnboardingTaskStatus } from '@prisma/client';
import { z } from 'zod';

export const createOnboardingChecklistSchema = z.object({
  employeeId: z.string().min(1),
  templateName: z.string().trim().min(1).default('Default'),
  taskNames: z.array(z.string().trim().min(1)).min(1, 'At least one task is required'),
});
export type CreateOnboardingChecklistInput = z.infer<typeof createOnboardingChecklistSchema>;

export const updateOnboardingTaskSchema = z.object({
  status: z.nativeEnum(OnboardingTaskStatus).optional(),
  assignedToId: z.string().min(1).optional(),
  dueDate: z.coerce.date().optional(),
});
export type UpdateOnboardingTaskInput = z.infer<typeof updateOnboardingTaskSchema>;
