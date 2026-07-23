import type { Request, Response } from 'express';
import { sendCreated, sendPaginated, sendSuccess } from '../../lib/response.js';
import * as recruitmentService from './recruitment.service.js';
import type {
  AddPanelistInput,
  CandidateInput,
  CreateInterviewInput,
  CreateOfferInput,
  JobOpeningInput,
  JobOpeningQuery,
  PanelistFeedbackInput,
  RespondOfferInput,
  UpdateCandidateStageInput,
  UpdateJobOpeningInput,
} from './recruitment.validation.js';

export async function listJobOpeningsHandler(req: Request, res: Response) {
  const query = req.query as unknown as JobOpeningQuery;
  const result = await recruitmentService.listJobOpenings(query);
  return sendPaginated(res, result);
}

export async function createJobOpeningHandler(req: Request, res: Response) {
  const body = req.body as JobOpeningInput;
  const jobOpening = await recruitmentService.createJobOpening(body);
  return sendCreated(res, jobOpening);
}

export async function updateJobOpeningHandler(req: Request, res: Response) {
  const body = req.body as UpdateJobOpeningInput;
  const jobOpening = await recruitmentService.updateJobOpening(req.params.id as string, body);
  return sendSuccess(res, jobOpening, 'Job opening updated successfully');
}

export async function deleteJobOpeningHandler(req: Request, res: Response) {
  await recruitmentService.deleteJobOpening(req.params.id as string);
  return sendSuccess(res, null, 'Job opening deleted successfully');
}

export async function addCandidateHandler(req: Request, res: Response) {
  const body = req.body as CandidateInput;
  const candidate = await recruitmentService.addCandidate(req.params.jobOpeningId as string, body);
  return sendCreated(res, candidate);
}

export async function listCandidatesHandler(req: Request, res: Response) {
  const candidates = await recruitmentService.listCandidates(req.params.jobOpeningId as string);
  return sendSuccess(res, candidates);
}

export async function updateCandidateStageHandler(req: Request, res: Response) {
  const body = req.body as UpdateCandidateStageInput;
  const candidate = await recruitmentService.updateCandidateStage(req.params.id as string, body.stage);
  return sendSuccess(res, candidate, 'Candidate stage updated successfully');
}

export async function createInterviewHandler(req: Request, res: Response) {
  const body = req.body as CreateInterviewInput;
  const interview = await recruitmentService.createInterview(req.params.id as string, body);
  return sendCreated(res, interview);
}

export async function addPanelistHandler(req: Request, res: Response) {
  const body = req.body as AddPanelistInput;
  const panelist = await recruitmentService.addPanelist(req.params.id as string, body);
  return sendCreated(res, panelist);
}

export async function submitPanelistFeedbackHandler(req: Request, res: Response) {
  const body = req.body as PanelistFeedbackInput;
  const panelist = await recruitmentService.submitPanelistFeedback(req.params.panelistId as string, req.user!.sub, body);
  return sendSuccess(res, panelist, 'Feedback submitted successfully');
}

export async function createOrUpdateOfferHandler(req: Request, res: Response) {
  const body = req.body as CreateOfferInput;
  const offer = await recruitmentService.createOrUpdateOffer(req.params.id as string, body);
  return sendSuccess(res, offer, 'Offer saved successfully');
}

export async function sendOfferHandler(req: Request, res: Response) {
  const offer = await recruitmentService.sendOffer(req.params.id as string);
  return sendSuccess(res, offer, 'Offer sent successfully');
}

export async function respondOfferHandler(req: Request, res: Response) {
  const body = req.body as RespondOfferInput;
  const offer = await recruitmentService.respondToOffer(req.params.id as string, body);
  return sendSuccess(res, offer, 'Offer response recorded');
}
