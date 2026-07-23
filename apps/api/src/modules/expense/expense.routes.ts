import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './expense.controller.js';
import { createExpenseClaimSchema, expenseClaimQuerySchema, expenseDecisionSchema } from './expense.validation.js';

export const expenseRoutes = Router();

expenseRoutes.post(
  '/claims',
  ...requireAuth(),
  validate(createExpenseClaimSchema),
  asyncHandler(controller.createExpenseClaimHandler),
);
expenseRoutes.post('/claims/:id/submit', ...requireAuth(), asyncHandler(controller.submitExpenseClaimHandler));
expenseRoutes.get(
  '/claims/me',
  ...requireAuth(),
  validate(expenseClaimQuerySchema, 'query'),
  asyncHandler(controller.listMyExpenseClaimsHandler),
);
expenseRoutes.get(
  '/claims',
  ...requireAuth('expense:read'),
  validate(expenseClaimQuerySchema, 'query'),
  asyncHandler(controller.listExpenseClaimsHandler),
);
expenseRoutes.post(
  '/claims/:id/decide',
  ...requireAuth('expense:approve'),
  validate(expenseDecisionSchema),
  asyncHandler(controller.decideExpenseClaimHandler),
);
