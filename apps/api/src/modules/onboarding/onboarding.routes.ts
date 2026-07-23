import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './onboarding.controller.js';
import { createOnboardingChecklistSchema, updateOnboardingTaskSchema } from './onboarding.validation.js';

export const onboardingRoutes = Router();

onboardingRoutes.post(
  '/checklists',
  ...requireAuth('onboarding:create'),
  validate(createOnboardingChecklistSchema),
  asyncHandler(controller.createChecklistHandler),
);
onboardingRoutes.get('/checklists/:employeeId', ...requireAuth(), asyncHandler(controller.getChecklistHandler));
onboardingRoutes.patch(
  '/tasks/:id',
  ...requireAuth('onboarding:update'),
  validate(updateOnboardingTaskSchema),
  asyncHandler(controller.updateTaskHandler),
);
