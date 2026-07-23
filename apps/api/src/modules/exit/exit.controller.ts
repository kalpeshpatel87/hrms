import type { Request, Response } from 'express';
import { sendCreated, sendPaginated, sendSuccess } from '../../lib/response.js';
import * as exitService from './exit.service.js';
import type {
  CreateExitInterviewInput,
  CreateResignationInput,
  ResignationQuery,
  UpdateExitTaskInput,
} from './exit.validation.js';

export async function createResignationHandler(req: Request, res: Response) {
  const body = req.body as CreateResignationInput;
  const resignation = await exitService.createResignation(req.user!.sub, body);
  return sendCreated(res, resignation);
}

export async function listMyResignationsHandler(req: Request, res: Response) {
  const query = req.query as unknown as ResignationQuery;
  const result = await exitService.listMyResignations(req.user!.sub, query);
  return sendPaginated(res, result);
}

export async function listResignationsHandler(req: Request, res: Response) {
  const query = req.query as unknown as ResignationQuery;
  const result = await exitService.listResignations(query);
  return sendPaginated(res, result);
}

export async function approveResignationHandler(req: Request, res: Response) {
  const resignation = await exitService.decideResignation(req.user!.sub, req.params.id as string, true);
  return sendSuccess(res, resignation, 'Resignation approved successfully');
}

export async function rejectResignationHandler(req: Request, res: Response) {
  const resignation = await exitService.decideResignation(req.user!.sub, req.params.id as string, false);
  return sendSuccess(res, resignation, 'Resignation rejected');
}

export async function updateExitTaskHandler(req: Request, res: Response) {
  const body = req.body as UpdateExitTaskInput;
  const task = await exitService.updateExitTask(req.params.id as string, body);
  return sendSuccess(res, task, 'Exit task updated successfully');
}

export async function createExitInterviewHandler(req: Request, res: Response) {
  const body = req.body as CreateExitInterviewInput;
  const interview = await exitService.createExitInterview(req.params.id as string, req.user!.sub, body);
  return sendCreated(res, interview);
}
