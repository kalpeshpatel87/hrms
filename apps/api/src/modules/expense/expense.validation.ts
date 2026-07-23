import { ExpenseCategory, ExpenseStatus } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '@atyantik/shared-types';

export const expenseClaimQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ExpenseStatus).optional(),
  employeeId: z.string().min(1).optional(),
});
export type ExpenseClaimQuery = z.infer<typeof expenseClaimQuerySchema>;

export const expenseItemInputSchema = z.object({
  category: z.nativeEnum(ExpenseCategory),
  amount: z.coerce.number().positive(),
  expenseDate: z.coerce.date(),
  receiptUrl: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});
export type ExpenseItemInput = z.infer<typeof expenseItemInputSchema>;

export const createExpenseClaimSchema = z.object({
  title: z.string().trim().min(1),
  currency: z.string().min(1).default('INR'),
  items: z.array(expenseItemInputSchema).min(1, 'At least one expense item is required'),
});
export type CreateExpenseClaimInput = z.infer<typeof createExpenseClaimSchema>;

export const expenseDecisionSchema = z.object({
  status: z
    .nativeEnum(ExpenseStatus)
    .refine((status) => status === ExpenseStatus.APPROVED || status === ExpenseStatus.REJECTED, {
      message: 'status must be APPROVED or REJECTED',
    }),
});
export type ExpenseDecisionInput = z.infer<typeof expenseDecisionSchema>;
