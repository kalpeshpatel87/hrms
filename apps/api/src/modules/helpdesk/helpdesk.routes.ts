import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './helpdesk.controller.js';
import {
  createTicketCommentSchema,
  createTicketSchema,
  ticketQuerySchema,
  updateTicketSchema,
} from './helpdesk.validation.js';

export const helpdeskRoutes = Router();

helpdeskRoutes.post('/tickets', ...requireAuth(), validate(createTicketSchema), asyncHandler(controller.createTicketHandler));
helpdeskRoutes.get(
  '/tickets/me',
  ...requireAuth(),
  validate(ticketQuerySchema, 'query'),
  asyncHandler(controller.listMyTicketsHandler),
);
helpdeskRoutes.get(
  '/tickets',
  ...requireAuth('helpdesk:read'),
  validate(ticketQuerySchema, 'query'),
  asyncHandler(controller.listTicketsHandler),
);
helpdeskRoutes.get('/tickets/:id', ...requireAuth(), asyncHandler(controller.getTicketHandler));
helpdeskRoutes.patch(
  '/tickets/:id',
  ...requireAuth('helpdesk:update'),
  validate(updateTicketSchema),
  asyncHandler(controller.updateTicketHandler),
);
helpdeskRoutes.get('/tickets/:id/comments', ...requireAuth(), asyncHandler(controller.listCommentsHandler));
helpdeskRoutes.post(
  '/tickets/:id/comments',
  ...requireAuth(),
  validate(createTicketCommentSchema),
  asyncHandler(controller.addCommentHandler),
);
