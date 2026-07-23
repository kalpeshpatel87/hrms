import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './recruitment.controller.js';
import {
  addPanelistSchema,
  candidateSchema,
  createInterviewSchema,
  createOfferSchema,
  jobOpeningQuerySchema,
  jobOpeningSchema,
  panelistFeedbackSchema,
  respondOfferSchema,
  updateCandidateStageSchema,
  updateJobOpeningSchema,
} from './recruitment.validation.js';

export const recruitmentRoutes = Router();

const gate = requireAuth('recruitment:read');
const write = requireAuth('recruitment:create');
const update = requireAuth('recruitment:update');

recruitmentRoutes.get('/job-openings', ...gate, validate(jobOpeningQuerySchema, 'query'), asyncHandler(controller.listJobOpeningsHandler));
recruitmentRoutes.post('/job-openings', ...write, validate(jobOpeningSchema), asyncHandler(controller.createJobOpeningHandler));
recruitmentRoutes.patch(
  '/job-openings/:id',
  ...update,
  validate(updateJobOpeningSchema),
  asyncHandler(controller.updateJobOpeningHandler),
);
recruitmentRoutes.delete('/job-openings/:id', ...requireAuth('recruitment:delete'), asyncHandler(controller.deleteJobOpeningHandler));

recruitmentRoutes.get('/job-openings/:jobOpeningId/candidates', ...gate, asyncHandler(controller.listCandidatesHandler));
recruitmentRoutes.post(
  '/job-openings/:jobOpeningId/candidates',
  ...write,
  validate(candidateSchema),
  asyncHandler(controller.addCandidateHandler),
);
recruitmentRoutes.patch(
  '/candidates/:id/stage',
  ...update,
  validate(updateCandidateStageSchema),
  asyncHandler(controller.updateCandidateStageHandler),
);

recruitmentRoutes.post(
  '/candidates/:id/interviews',
  ...write,
  validate(createInterviewSchema),
  asyncHandler(controller.createInterviewHandler),
);
recruitmentRoutes.post(
  '/interviews/:id/panelists',
  ...update,
  validate(addPanelistSchema),
  asyncHandler(controller.addPanelistHandler),
);
recruitmentRoutes.post(
  '/interviews/panelists/:panelistId/feedback',
  ...requireAuth(),
  validate(panelistFeedbackSchema),
  asyncHandler(controller.submitPanelistFeedbackHandler),
);

recruitmentRoutes.put(
  '/candidates/:id/offer',
  ...update,
  validate(createOfferSchema),
  asyncHandler(controller.createOrUpdateOfferHandler),
);
recruitmentRoutes.post('/candidates/:id/offer/send', ...update, asyncHandler(controller.sendOfferHandler));
recruitmentRoutes.post(
  '/candidates/:id/offer/respond',
  ...requireAuth(),
  validate(respondOfferSchema),
  asyncHandler(controller.respondOfferHandler),
);
