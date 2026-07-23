import type { Request, Response } from 'express';
import { sendCreated, sendSuccess } from '../../lib/response.js';
import * as onboardingService from './onboarding.service.js';
import type { CreateOnboardingChecklistInput, UpdateOnboardingTaskInput } from './onboarding.validation.js';

export async function createChecklistHandler(req: Request, res: Response) {
  const body = req.body as CreateOnboardingChecklistInput;
  const checklist = await onboardingService.createChecklist(body);
  return sendCreated(res, checklist);
}

export async function getChecklistHandler(req: Request, res: Response) {
  const checklist = await onboardingService.getChecklistForEmployee(req.params.employeeId as string, req.user!);
  return sendSuccess(res, checklist);
}

export async function updateTaskHandler(req: Request, res: Response) {
  const body = req.body as UpdateOnboardingTaskInput;
  const task = await onboardingService.updateTask(req.params.id as string, body);
  return sendSuccess(res, task, 'Onboarding task updated successfully');
}
