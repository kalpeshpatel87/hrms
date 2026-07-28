import { z } from 'zod';
import { paginationQuerySchema } from '@atyantik/shared-types';

export const idParamSchema = z.object({
  id: z.string().min(1),
});

const weekDayEnum = z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']);
const holidayTypeEnum = z.enum(['NATIONAL', 'RESTRICTED', 'COMPANY', 'REGIONAL']);

// ---------------------------------------------------------------------------
// Department
// ---------------------------------------------------------------------------

export const departmentCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  parentDepartmentId: z.string().min(1).optional().nullable(),
  headEmployeeId: z.string().min(1).optional().nullable(),
});
export const departmentUpdateSchema = departmentCreateSchema.partial();
export const departmentQuerySchema = paginationQuerySchema.extend({
  parentDepartmentId: z.string().min(1).optional(),
  rootOnly: z.coerce.boolean().optional(),
});

export type DepartmentCreateInput = z.infer<typeof departmentCreateSchema>;
export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>;
export type DepartmentQuery = z.infer<typeof departmentQuerySchema>;

// ---------------------------------------------------------------------------
// Designation
// ---------------------------------------------------------------------------

export const designationCreateSchema = z.object({
  title: z.string().min(1),
  level: z.coerce.number().int().optional().nullable(),
  departmentId: z.string().min(1).optional().nullable(),
});
export const designationUpdateSchema = designationCreateSchema.partial();
export const designationQuerySchema = paginationQuerySchema.extend({
  departmentId: z.string().min(1).optional(),
});

export type DesignationCreateInput = z.infer<typeof designationCreateSchema>;
export type DesignationUpdateInput = z.infer<typeof designationUpdateSchema>;
export type DesignationQuery = z.infer<typeof designationQuerySchema>;

// ---------------------------------------------------------------------------
// Branch
// ---------------------------------------------------------------------------

export const branchCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  timezone: z.string().min(1).optional(),
});
export const branchUpdateSchema = branchCreateSchema.partial();
export const branchQuerySchema = paginationQuerySchema;

export type BranchCreateInput = z.infer<typeof branchCreateSchema>;
export type BranchUpdateInput = z.infer<typeof branchUpdateSchema>;
export type BranchQuery = z.infer<typeof branchQuerySchema>;

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export const teamCreateSchema = z.object({
  name: z.string().min(1),
  departmentId: z.string().min(1).optional().nullable(),
  leadEmployeeId: z.string().min(1).optional().nullable(),
});
export const teamUpdateSchema = teamCreateSchema.partial();
export const teamQuerySchema = paginationQuerySchema.extend({
  departmentId: z.string().min(1).optional(),
});

export type TeamCreateInput = z.infer<typeof teamCreateSchema>;
export type TeamUpdateInput = z.infer<typeof teamUpdateSchema>;
export type TeamQuery = z.infer<typeof teamQuerySchema>;

// ---------------------------------------------------------------------------
// Shift
// ---------------------------------------------------------------------------

export const shiftCreateSchema = z.object({
  name: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  breakMinutes: z.coerce.number().int().min(0).default(0),
  weekOffDays: z.array(weekDayEnum).default([]),
  gracePeriodMinutes: z.coerce.number().int().min(0).default(0),
});
export const shiftUpdateSchema = shiftCreateSchema.partial();
export const shiftQuerySchema = paginationQuerySchema;

export type ShiftCreateInput = z.infer<typeof shiftCreateSchema>;
export type ShiftUpdateInput = z.infer<typeof shiftUpdateSchema>;
export type ShiftQuery = z.infer<typeof shiftQuerySchema>;

// ---------------------------------------------------------------------------
// Holiday
// ---------------------------------------------------------------------------

export const holidayCreateSchema = z.object({
  branchId: z.string().min(1).optional().nullable(),
  name: z.string().min(1),
  date: z.coerce.date(),
  type: holidayTypeEnum.default('NATIONAL'),
  isOptional: z.boolean().default(false),
});
export const holidayUpdateSchema = holidayCreateSchema.partial();
export const holidayQuerySchema = paginationQuerySchema.extend({
  branchId: z.string().min(1).optional(),
  type: holidayTypeEnum.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type HolidayCreateInput = z.infer<typeof holidayCreateSchema>;
export type HolidayUpdateInput = z.infer<typeof holidayUpdateSchema>;
export type HolidayQuery = z.infer<typeof holidayQuerySchema>;

// ---------------------------------------------------------------------------
// Company (singleton) + CompanySetting (key/value)
// ---------------------------------------------------------------------------

export const companyUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  legalName: z.string().optional().nullable(),
  cin: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  timezone: z.string().min(1).optional(),
  defaultCurrency: z.string().min(1).optional(),
});
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;

export const companySettingKeyParamSchema = z.object({
  key: z.string().min(1),
});
export const companySettingUpsertSchema = z.object({
  value: z.unknown(),
});
export const companySettingQuerySchema = paginationQuerySchema;

export type CompanySettingUpsertInput = z.infer<typeof companySettingUpsertSchema>;

// ---------------------------------------------------------------------------
// AuditLog (read-only)
// ---------------------------------------------------------------------------

export const auditLogQuerySchema = paginationQuerySchema.merge(
  z.object({
    entityType: z.string().min(1).optional(),
    actorId: z.string().min(1).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
  }),
);
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
export type CompanySettingQuery = z.infer<typeof companySettingQuerySchema>;
