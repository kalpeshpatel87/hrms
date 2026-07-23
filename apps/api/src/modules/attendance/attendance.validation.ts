import { AttendanceStatus, ApprovalStatus } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '@atyantik/shared-types';

export const checkInSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

export const checkOutSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

export const breakInSchema = z.object({
  breakType: z.string().trim().min(1).optional(),
});

export const breakOutSchema = z.object({});

export const myAttendanceQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const attendanceQuerySchema = paginationQuerySchema.merge(
  z.object({
    employeeId: z.string().min(1).optional(),
    departmentId: z.string().min(1).optional(),
    status: z.nativeEnum(AttendanceStatus).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
  }),
);

export const updateAttendanceSchema = z
  .object({
    checkInAt: z.coerce.date().optional(),
    checkOutAt: z.coerce.date().optional(),
    status: z.nativeEnum(AttendanceStatus).optional(),
    remarks: z.string().trim().optional(),
    isRegularized: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

export const createCorrectionRequestSchema = z
  .object({
    attendanceRecordId: z.string().min(1),
    requestedCheckInAt: z.coerce.date().optional(),
    requestedCheckOutAt: z.coerce.date().optional(),
    reason: z.string().trim().min(1, 'Reason is required'),
  })
  .refine((data) => data.requestedCheckInAt !== undefined || data.requestedCheckOutAt !== undefined, {
    message: 'At least one of requestedCheckInAt or requestedCheckOutAt is required',
    path: ['requestedCheckInAt'],
  });

export const correctionRequestQuerySchema = paginationQuerySchema.merge(
  z.object({
    status: z.nativeEnum(ApprovalStatus).optional(),
    employeeId: z.string().min(1).optional(),
  }),
);

export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type BreakInInput = z.infer<typeof breakInSchema>;
export type MyAttendanceQuery = z.infer<typeof myAttendanceQuerySchema>;
export type AttendanceQuery = z.infer<typeof attendanceQuerySchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type CreateCorrectionRequestInput = z.infer<typeof createCorrectionRequestSchema>;
export type CorrectionRequestQuery = z.infer<typeof correctionRequestQuerySchema>;
