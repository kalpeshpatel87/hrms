import { ApprovalStatus, ExpenseCategory, PayrollRunStatus } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '@atyantik/shared-types';

export const idParamSchema = z.object({
  id: z.string().min(1),
});
export type IdParam = z.infer<typeof idParamSchema>;

export const employeeIdParamSchema = z.object({
  employeeId: z.string().min(1),
});
export type EmployeeIdParam = z.infer<typeof employeeIdParamSchema>;

// -----------------------------------------------------------------------
// Salary structure
// -----------------------------------------------------------------------

export const salaryStructureComponentInputSchema = z.object({
  salaryComponentId: z.string().min(1),
  amount: z.coerce.number().min(0).default(0),
  percentage: z.coerce.number().min(0).max(100).optional(),
  formula: z.string().min(1).optional(),
});
export type SalaryStructureComponentInput = z.infer<typeof salaryStructureComponentInputSchema>;

export const createSalaryStructureSchema = z.object({
  employeeId: z.string().min(1),
  effectiveFrom: z.coerce.date(),
  ctcAnnual: z.coerce.number().positive(),
  currency: z.string().min(1).default('INR'),
  reason: z.string().min(1).optional(),
  components: z.array(salaryStructureComponentInputSchema).min(1, 'At least one component is required'),
});
export type CreateSalaryStructureInput = z.infer<typeof createSalaryStructureSchema>;

// -----------------------------------------------------------------------
// Payroll runs
// -----------------------------------------------------------------------

export const createPayrollRunSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});
export type CreatePayrollRunInput = z.infer<typeof createPayrollRunSchema>;

export const payrollRunQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(PayrollRunStatus).optional(),
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});
export type PayrollRunQuery = z.infer<typeof payrollRunQuerySchema>;

// -----------------------------------------------------------------------
// Reimbursements
// -----------------------------------------------------------------------

export const createReimbursementSchema = z.object({
  employeeId: z.string().min(1),
  category: z.nativeEnum(ExpenseCategory),
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
  receiptUrl: z.string().optional(),
});
export type CreateReimbursementInput = z.infer<typeof createReimbursementSchema>;

export const reimbursementQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ApprovalStatus).optional(),
  employeeId: z.string().optional(),
});
export type ReimbursementQuery = z.infer<typeof reimbursementQuerySchema>;

export const reimbursementDecisionSchema = z.object({
  status: z
    .nativeEnum(ApprovalStatus)
    .refine((status) => status === ApprovalStatus.APPROVED || status === ApprovalStatus.REJECTED, {
      message: 'status must be APPROVED or REJECTED',
    }),
});
export type ReimbursementDecisionInput = z.infer<typeof reimbursementDecisionSchema>;

// -----------------------------------------------------------------------
// Deductions
// -----------------------------------------------------------------------

export const createDeductionSchema = z.object({
  employeeId: z.string().min(1),
  type: z.string().min(1),
  amount: z.coerce.number().positive(),
  reason: z.string().optional(),
  payrollRunId: z.string().optional(),
});
export type CreateDeductionInput = z.infer<typeof createDeductionSchema>;

export const deductionQuerySchema = paginationQuerySchema.extend({
  employeeId: z.string().optional(),
});
export type DeductionQuery = z.infer<typeof deductionQuerySchema>;
