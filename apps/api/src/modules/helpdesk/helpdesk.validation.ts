import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '@atyantik/shared-types';

export const ticketQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  category: z.nativeEnum(TicketCategory).optional(),
  assignedToId: z.string().min(1).optional(),
});
export type TicketQuery = z.infer<typeof ticketQuerySchema>;

export const createTicketSchema = z.object({
  category: z.nativeEnum(TicketCategory).default('IT'),
  priority: z.nativeEnum(TicketPriority).default('MEDIUM'),
  subject: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const updateTicketSchema = z.object({
  category: z.nativeEnum(TicketCategory).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  assignedToId: z.string().min(1).optional().nullable(),
});
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

export const createTicketCommentSchema = z.object({
  body: z.string().trim().min(1),
  attachmentUrl: z.string().min(1).optional(),
  isInternal: z.boolean().default(false),
});
export type CreateTicketCommentInput = z.infer<typeof createTicketCommentSchema>;
