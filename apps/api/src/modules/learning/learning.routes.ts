import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './learning.controller.js';
import {
  assessmentSchema,
  courseQuerySchema,
  courseSchema,
  enrollmentQuerySchema,
  updateCourseSchema,
  updateEnrollmentProgressSchema,
} from './learning.validation.js';

export const learningRoutes = Router();

learningRoutes.get('/courses', ...requireAuth(), validate(courseQuerySchema, 'query'), asyncHandler(controller.listCoursesHandler));
learningRoutes.post(
  '/courses',
  ...requireAuth('learning:create'),
  validate(courseSchema),
  asyncHandler(controller.createCourseHandler),
);
learningRoutes.patch(
  '/courses/:id',
  ...requireAuth('learning:update'),
  validate(updateCourseSchema),
  asyncHandler(controller.updateCourseHandler),
);
learningRoutes.delete('/courses/:id', ...requireAuth('learning:delete'), asyncHandler(controller.deleteCourseHandler));
learningRoutes.post('/courses/:id/enroll', ...requireAuth(), asyncHandler(controller.enrollInCourseHandler));

learningRoutes.get(
  '/enrollments/me',
  ...requireAuth(),
  validate(enrollmentQuerySchema, 'query'),
  asyncHandler(controller.listMyEnrollmentsHandler),
);
learningRoutes.patch(
  '/enrollments/:id/progress',
  ...requireAuth(),
  validate(updateEnrollmentProgressSchema),
  asyncHandler(controller.updateEnrollmentProgressHandler),
);
learningRoutes.post(
  '/enrollments/:id/assessments',
  ...requireAuth(),
  validate(assessmentSchema),
  asyncHandler(controller.addAssessmentHandler),
);
