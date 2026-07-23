import type { Request, Response } from 'express';
import { sendCreated, sendPaginated, sendSuccess } from '../../lib/response.js';
import * as travelService from './travel.service.js';
import type { CreateTravelRequestInput, TravelDecisionInput, TravelQuery } from './travel.validation.js';

export async function createTravelRequestHandler(req: Request, res: Response) {
  const body = req.body as CreateTravelRequestInput;
  const request = await travelService.createTravelRequest(req.user!.sub, body);
  return sendCreated(res, request);
}

export async function listMyTravelRequestsHandler(req: Request, res: Response) {
  const query = req.query as unknown as TravelQuery;
  const result = await travelService.listMyTravelRequests(req.user!.sub, query);
  return sendPaginated(res, result);
}

export async function listTravelRequestsHandler(req: Request, res: Response) {
  const query = req.query as unknown as TravelQuery;
  const result = await travelService.listTravelRequests(query);
  return sendPaginated(res, result);
}

export async function decideTravelRequestHandler(req: Request, res: Response) {
  const body = req.body as TravelDecisionInput;
  const request = await travelService.decideTravelRequest(req.user!.sub, req.params.id as string, body);
  return sendSuccess(res, request, 'Travel request decision recorded');
}
