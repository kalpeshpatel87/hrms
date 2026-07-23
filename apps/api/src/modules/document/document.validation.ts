import { DocumentCategory } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '@atyantik/shared-types';

export const documentQuerySchema = paginationQuerySchema.extend({
  category: z.nativeEnum(DocumentCategory).optional(),
  entityType: z.string().min(1).optional(),
  entityId: z.string().min(1).optional(),
  ownerEmployeeId: z.string().min(1).optional(),
});
export type DocumentQuery = z.infer<typeof documentQuerySchema>;

export const createDocumentMetaSchema = z.object({
  title: z.string().trim().min(1),
  category: z.nativeEnum(DocumentCategory).default('OTHER'),
  entityType: z.string().min(1).optional(),
  entityId: z.string().min(1).optional(),
  ownerEmployeeId: z.string().min(1).optional(),
  isConfidential: z.coerce.boolean().default(false),
});
export type CreateDocumentMetaInput = z.infer<typeof createDocumentMetaSchema>;
