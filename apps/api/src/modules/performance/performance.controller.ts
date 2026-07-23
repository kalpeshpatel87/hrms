import type { Request, Response } from 'express';
import { sendCreated, sendPaginated, sendSuccess } from '../../lib/response.js';
import * as performanceService from './performance.service.js';
import type {
  AddReviewerInput,
  CreateGoalInput,
  CreateReviewInput,
  GoalQuery,
  ReviewQuery,
  SubmitFeedbackInput,
  UpdateGoalInput,
} from './performance.validation.js';

export async function createGoalHandler(req: Request, res: Response) {
  const body = req.body as CreateGoalInput;
  const goal = await performanceService.createGoal(req.user!.sub, body);
  return sendCreated(res, goal);
}

export async function listGoalsHandler(req: Request, res: Response) {
  const query = req.query as unknown as GoalQuery;
  const result = await performanceService.listGoals(query);
  return sendPaginated(res, result);
}

export async function listMyGoalsHandler(req: Request, res: Response) {
  const query = req.query as unknown as GoalQuery;
  const result = await performanceService.listMyGoals(req.user!.sub, query);
  return sendPaginated(res, result);
}

export async function updateGoalHandler(req: Request, res: Response) {
  const body = req.body as UpdateGoalInput;
  const goal = await performanceService.updateGoal(req.params.id as string, body);
  return sendSuccess(res, goal, 'Goal updated successfully');
}

export async function deleteGoalHandler(req: Request, res: Response) {
  await performanceService.deleteGoal(req.params.id as string);
  return sendSuccess(res, null, 'Goal deleted successfully');
}

export async function createReviewHandler(req: Request, res: Response) {
  const body = req.body as CreateReviewInput;
  const review = await performanceService.createReview(body);
  return sendCreated(res, review);
}

export async function listReviewsHandler(req: Request, res: Response) {
  const query = req.query as unknown as ReviewQuery;
  const result = await performanceService.listReviews(query);
  return sendPaginated(res, result);
}

export async function listMyReviewsHandler(req: Request, res: Response) {
  const reviews = await performanceService.listMyReviews(req.user!.sub);
  return sendSuccess(res, reviews);
}

export async function addReviewerHandler(req: Request, res: Response) {
  const body = req.body as AddReviewerInput;
  const assignment = await performanceService.addReviewer(req.params.id as string, body);
  return sendCreated(res, assignment);
}

export async function submitFeedbackHandler(req: Request, res: Response) {
  const body = req.body as SubmitFeedbackInput;
  const feedback = await performanceService.submitFeedback(req.params.id as string, req.user!.sub, body);
  return sendCreated(res, feedback);
}
