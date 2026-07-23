import { AnnouncementAudience } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '@atyantik/shared-types';

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const attachmentParamSchema = z.object({
  id: z.string().min(1),
  attachmentId: z.string().min(1),
});

const audienceEnum = z.nativeEnum(AnnouncementAudience);

export const announcementQuerySchema = paginationQuerySchema.merge(
  z.object({
    isPinned: z.coerce.boolean().optional(),
  }),
);
export type AnnouncementQuery = z.infer<typeof announcementQuerySchema>;

export const createAnnouncementSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required'),
    body: z.string().trim().min(1, 'Body is required'),
    audience: audienceEnum.default(AnnouncementAudience.ALL_EMPLOYEES),
    targetDepartmentId: z.string().min(1).optional().nullable(),
    targetBranchId: z.string().min(1).optional().nullable(),
    targetRoleId: z.string().min(1).optional().nullable(),
    publishAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional().nullable(),
    isPinned: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.audience === AnnouncementAudience.DEPARTMENT && !data.targetDepartmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'targetDepartmentId is required when audience is DEPARTMENT',
        path: ['targetDepartmentId'],
      });
    }
    if (data.audience === AnnouncementAudience.BRANCH && !data.targetBranchId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'targetBranchId is required when audience is BRANCH',
        path: ['targetBranchId'],
      });
    }
    if (data.audience === AnnouncementAudience.ROLE && !data.targetRoleId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'targetRoleId is required when audience is ROLE',
        path: ['targetRoleId'],
      });
    }
    if (data.expiresAt && data.publishAt && data.expiresAt <= data.publishAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'expiresAt must be after publishAt',
        path: ['expiresAt'],
      });
    }
  });
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

export const updateAnnouncementSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    body: z.string().trim().min(1).optional(),
    audience: audienceEnum.optional(),
    targetDepartmentId: z.string().min(1).optional().nullable(),
    targetBranchId: z.string().min(1).optional().nullable(),
    targetRoleId: z.string().min(1).optional().nullable(),
    publishAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional().nullable(),
    isPinned: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
