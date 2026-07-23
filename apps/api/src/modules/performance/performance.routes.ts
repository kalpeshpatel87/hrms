import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './performance.controller.js';
import {
  addReviewerSchema,
  createGoalSchema,
  createReviewSchema,
  goalQuerySchema,
  reviewQuerySchema,
  submitFeedbackSchema,
  updateGoalSchema,
} from './performance.validation.js';

export const performanceRoutes = Router();

performanceRoutes.get(
  '/goals/me',
  ...requireAuth(),
  validate(goalQuerySchema, 'query'),
  asyncHandler(controller.listMyGoalsHandler),
);
performanceRoutes.get(
  '/goals',
  ...requireAuth('performance:read'),
  validate(goalQuerySchema, 'query'),
  asyncHandler(controller.listGoalsHandler),
);
performanceRoutes.post('/goals', ...requireAuth(), validate(createGoalSchema), asyncHandler(controller.createGoalHandler));
performanceRoutes.patch(
  '/goals/:id',
  ...requireAuth(),
  validate(updateGoalSchema),
  asyncHandler(controller.updateGoalHandler),
);
performanceRoutes.delete('/goals/:id', ...requireAuth('performance:delete'), asyncHandler(controller.deleteGoalHandler));

performanceRoutes.get('/reviews/me', ...requireAuth(), asyncHandler(controller.listMyReviewsHandler));
performanceRoutes.get(
  '/reviews',
  ...requireAuth('performance:read'),
  validate(reviewQuerySchema, 'query'),
  asyncHandler(controller.listReviewsHandler),
);
performanceRoutes.post(
  '/reviews',
  ...requireAuth('performance:create'),
  validate(createReviewSchema),
  asyncHandler(controller.createReviewHandler),
);
performanceRoutes.post(
  '/reviews/:id/reviewers',
  ...requireAuth('performance:update'),
  validate(addReviewerSchema),
  asyncHandler(controller.addReviewerHandler),
);
performanceRoutes.post(
  '/reviews/:id/feedback',
  ...requireAuth(),
  validate(submitFeedbackSchema),
  asyncHandler(controller.submitFeedbackHandler),
);
