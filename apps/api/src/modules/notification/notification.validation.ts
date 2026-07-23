import { z } from 'zod';
import { paginationQuerySchema } from '@atyantik/shared-types';

export const NOTIFICATION_TYPE_VALUES = [
  'SYSTEM',
  'LEAVE',
  'ATTENDANCE',
  'PAYROLL',
  'ANNOUNCEMENT',
  'TICKET',
  'PERFORMANCE',
  'RECRUITMENT',
  'ASSET',
  'EXPENSE',
  'TRAVEL',
  'ONBOARDING',
  'EXIT',
  'GENERIC',
] as const;

export const notificationQuerySchema = paginationQuerySchema.extend({
  isRead: z.coerce.boolean().optional(),
  type: z.enum(NOTIFICATION_TYPE_VALUES).optional(),
});
export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
