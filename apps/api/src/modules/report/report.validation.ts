import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const monthYearQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).default(new Date().getMonth() + 1),
  year: z.coerce.number().int().min(2000).max(currentYear + 1).default(currentYear),
});
export type MonthYearQuery = z.infer<typeof monthYearQuerySchema>;

export const yearQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(currentYear + 1).default(currentYear),
});
export type YearQuery = z.infer<typeof yearQuerySchema>;
