import { TravelStatus } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '@atyantik/shared-types';

export const travelQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(TravelStatus).optional(),
  employeeId: z.string().min(1).optional(),
});
export type TravelQuery = z.infer<typeof travelQuerySchema>;

export const createTravelRequestSchema = z
  .object({
    purpose: z.string().trim().min(1),
    origin: z.string().trim().min(1),
    destination: z.string().trim().min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    estimatedCost: z.coerce.number().min(0).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, { message: 'endDate must be on/after startDate', path: ['endDate'] });
export type CreateTravelRequestInput = z.infer<typeof createTravelRequestSchema>;

export const travelDecisionSchema = z.object({
  status: z
    .nativeEnum(TravelStatus)
    .refine((status) => status === TravelStatus.APPROVED || status === TravelStatus.REJECTED, {
      message: 'status must be APPROVED or REJECTED',
    }),
});
export type TravelDecisionInput = z.infer<typeof travelDecisionSchema>;
