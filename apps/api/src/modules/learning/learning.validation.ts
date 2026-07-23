import { EnrollmentStatus } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '@atyantik/shared-types';

export const courseSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().min(1).optional(),
  durationMinutes: z.coerce.number().int().positive().optional(),
  provider: z.string().min(1).optional(),
  isMandatory: z.boolean().default(false),
});
export const updateCourseSchema = courseSchema.partial();
export type CourseInput = z.infer<typeof courseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

export const courseQuerySchema = paginationQuerySchema;
export type CourseQuery = z.infer<typeof courseQuerySchema>;

export const enrollmentQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(EnrollmentStatus).optional(),
});
export type EnrollmentQuery = z.infer<typeof enrollmentQuerySchema>;

export const updateEnrollmentProgressSchema = z.object({
  status: z.nativeEnum(EnrollmentStatus).optional(),
  score: z.coerce.number().min(0).max(100).optional(),
});
export type UpdateEnrollmentProgressInput = z.infer<typeof updateEnrollmentProgressSchema>;

export const assessmentSchema = z.object({
  title: z.string().trim().min(1),
  maxScore: z.coerce.number().positive(),
  obtainedScore: z.coerce.number().min(0).optional(),
  attemptedAt: z.coerce.date().optional(),
});
export type AssessmentInput = z.infer<typeof assessmentSchema>;
