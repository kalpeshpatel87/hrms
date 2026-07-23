import { ProjectStatus, TimesheetStatus } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '@atyantik/shared-types';

export const clientSchema = z.object({
  name: z.string().trim().min(1),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(1).optional(),
});
export const updateClientSchema = clientSchema.partial();
export type ClientInput = z.infer<typeof clientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

export const projectSchema = z.object({
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  clientId: z.string().min(1).optional(),
  status: z.nativeEnum(ProjectStatus).default('PLANNING'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
export const updateProjectSchema = projectSchema.partial();
export type ProjectInput = z.infer<typeof projectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const projectQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ProjectStatus).optional(),
});
export type ProjectQuery = z.infer<typeof projectQuerySchema>;

export const projectAssignmentSchema = z.object({
  employeeId: z.string().min(1),
  role: z.string().min(1).optional(),
  allocationPercent: z.coerce.number().min(0).max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
export type ProjectAssignmentInput = z.infer<typeof projectAssignmentSchema>;

export const timesheetEntryInputSchema = z.object({
  projectId: z.string().min(1),
  date: z.coerce.date(),
  hours: z.coerce.number().positive().max(24),
  isBillable: z.boolean().default(true),
  description: z.string().min(1).optional(),
});
export type TimesheetEntryInput = z.infer<typeof timesheetEntryInputSchema>;

export const createTimesheetSchema = z.object({
  weekStartDate: z.coerce.date(),
  entries: z.array(timesheetEntryInputSchema).default([]),
});
export type CreateTimesheetInput = z.infer<typeof createTimesheetSchema>;

export const timesheetQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(TimesheetStatus).optional(),
});
export type TimesheetQuery = z.infer<typeof timesheetQuerySchema>;
