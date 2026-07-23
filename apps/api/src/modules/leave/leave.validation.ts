import { ApprovalStatus, EmploymentType, LeaveStatus, LeaveUnit } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '@atyantik/shared-types';

export const idParamSchema = z.object({
  id: z.string().min(1),
});

// ---------------------------------------------------------------------------
// LeaveType (admin catalog management)
// ---------------------------------------------------------------------------

export const createLeaveTypeSchema = z.object({
  name: z.string().min(1).max(150),
  code: z.string().min(1).max(30),
  isPaid: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
  maxConsecutiveDays: z.coerce.number().int().positive().optional(),
  allowNegativeBalance: z.boolean().default(false),
});

export const updateLeaveTypeSchema = createLeaveTypeSchema.partial();

export const leaveTypeQuerySchema = paginationQuerySchema;

// ---------------------------------------------------------------------------
// LeavePolicy (admin catalog management)
// ---------------------------------------------------------------------------

export const createLeavePolicySchema = z.object({
  leaveTypeId: z.string().min(1),
  applicableEmploymentTypes: z.array(z.nativeEnum(EmploymentType)).min(1),
  annualQuota: z.coerce.number().nonnegative(),
  accrualFrequency: z.string().min(1).default('ANNUAL'),
  carryForwardLimit: z.coerce.number().nonnegative().optional(),
  effectiveFrom: z.coerce.date(),
});

export const updateLeavePolicySchema = createLeavePolicySchema.partial();

export const leavePolicyQuerySchema = paginationQuerySchema.extend({
  leaveTypeId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// LeaveBalance
// ---------------------------------------------------------------------------

export const leaveBalanceQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

// ---------------------------------------------------------------------------
// LeaveRequest
// ---------------------------------------------------------------------------

export const createLeaveRequestSchema = z
  .object({
    leaveTypeId: z.string().min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    startDayUnit: z.nativeEnum(LeaveUnit).default(LeaveUnit.FULL_DAY),
    endDayUnit: z.nativeEnum(LeaveUnit).default(LeaveUnit.FULL_DAY),
    reason: z.string().max(2000).optional(),
  })
  .refine((data) => data.startDate.getTime() <= data.endDate.getTime(), {
    message: 'startDate must be on or before endDate',
    path: ['endDate'],
  });

export const leaveRequestMeQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(LeaveStatus).optional(),
});

export const leaveRequestAdminQuerySchema = paginationQuerySchema.extend({
  employeeId: z.string().optional(),
  status: z.nativeEnum(LeaveStatus).optional(),
  leaveTypeId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const cancelLeaveRequestSchema = z.object({
  cancelReason: z.string().max(1000).optional(),
});

// ---------------------------------------------------------------------------
// LeaveApproval
// ---------------------------------------------------------------------------

export const leaveApprovalQuerySchema = paginationQuerySchema;

export const approvalActionSchema = z.object({
  comments: z.string().max(2000).optional(),
});

export type IdParam = z.infer<typeof idParamSchema>;
export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>;
export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>;
export type LeaveTypeQuery = z.infer<typeof leaveTypeQuerySchema>;
export type CreateLeavePolicyInput = z.infer<typeof createLeavePolicySchema>;
export type UpdateLeavePolicyInput = z.infer<typeof updateLeavePolicySchema>;
export type LeavePolicyQuery = z.infer<typeof leavePolicyQuerySchema>;
export type LeaveBalanceQuery = z.infer<typeof leaveBalanceQuerySchema>;
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
export type LeaveRequestMeQuery = z.infer<typeof leaveRequestMeQuerySchema>;
export type LeaveRequestAdminQuery = z.infer<typeof leaveRequestAdminQuerySchema>;
export type CancelLeaveRequestInput = z.infer<typeof cancelLeaveRequestSchema>;
export type LeaveApprovalQuery = z.infer<typeof leaveApprovalQuerySchema>;
export type ApprovalActionInput = z.infer<typeof approvalActionSchema>;

export { ApprovalStatus, EmploymentType, LeaveStatus, LeaveUnit };
