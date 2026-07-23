import { CandidateStage, EmploymentType, InterviewMode, JobOpeningStatus } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '@atyantik/shared-types';

export const jobOpeningSchema = z.object({
  departmentId: z.string().min(1).optional(),
  title: z.string().trim().min(1),
  description: z.string().min(1).optional(),
  employmentType: z.nativeEnum(EmploymentType).default('FULL_TIME'),
  numberOfPositions: z.coerce.number().int().min(1).default(1),
  status: z.nativeEnum(JobOpeningStatus).default('DRAFT'),
});
export const updateJobOpeningSchema = jobOpeningSchema.partial();
export type JobOpeningInput = z.infer<typeof jobOpeningSchema>;
export type UpdateJobOpeningInput = z.infer<typeof updateJobOpeningSchema>;

export const jobOpeningQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(JobOpeningStatus).optional(),
});
export type JobOpeningQuery = z.infer<typeof jobOpeningQuerySchema>;

export const candidateSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().email(),
  phone: z.string().min(1).optional(),
  resumeUrl: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
});
export type CandidateInput = z.infer<typeof candidateSchema>;

export const updateCandidateStageSchema = z.object({
  stage: z.nativeEnum(CandidateStage),
});
export type UpdateCandidateStageInput = z.infer<typeof updateCandidateStageSchema>;

export const createInterviewSchema = z.object({
  round: z.coerce.number().int().min(1).default(1),
  mode: z.nativeEnum(InterviewMode).default('VIDEO'),
  scheduledAt: z.coerce.date(),
});
export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;

export const addPanelistSchema = z.object({
  interviewerId: z.string().min(1),
});
export type AddPanelistInput = z.infer<typeof addPanelistSchema>;

export const panelistFeedbackSchema = z.object({
  feedback: z.string().min(1).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
});
export type PanelistFeedbackInput = z.infer<typeof panelistFeedbackSchema>;

export const createOfferSchema = z.object({
  designationId: z.string().min(1).optional(),
  ctcAnnual: z.coerce.number().positive(),
  joiningDate: z.coerce.date(),
});
export type CreateOfferInput = z.infer<typeof createOfferSchema>;

export const respondOfferSchema = z.object({
  accepted: z.boolean(),
});
export type RespondOfferInput = z.infer<typeof respondOfferSchema>;
