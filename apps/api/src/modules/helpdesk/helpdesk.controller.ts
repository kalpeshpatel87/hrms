import type { Request, Response } from 'express';
import { sendCreated, sendPaginated, sendSuccess } from '../../lib/response.js';
import * as helpdeskService from './helpdesk.service.js';
import type {
  CreateTicketCommentInput,
  CreateTicketInput,
  TicketQuery,
  UpdateTicketInput,
} from './helpdesk.validation.js';

export async function createTicketHandler(req: Request, res: Response) {
  const body = req.body as CreateTicketInput;
  const ticket = await helpdeskService.createTicket(req.user!.sub, body);
  return sendCreated(res, ticket);
}

export async function listMyTicketsHandler(req: Request, res: Response) {
  const query = req.query as unknown as TicketQuery;
  const result = await helpdeskService.listMyTickets(req.user!.sub, query);
  return sendPaginated(res, result);
}

export async function listTicketsHandler(req: Request, res: Response) {
  const query = req.query as unknown as TicketQuery;
  const result = await helpdeskService.listTickets(query);
  return sendPaginated(res, result);
}

export async function getTicketHandler(req: Request, res: Response) {
  const ticket = await helpdeskService.getTicketOrThrow(req.params.id as string, req.user!);
  return sendSuccess(res, ticket);
}

export async function updateTicketHandler(req: Request, res: Response) {
  const body = req.body as UpdateTicketInput;
  const ticket = await helpdeskService.updateTicket(req.params.id as string, body);
  return sendSuccess(res, ticket, 'Ticket updated successfully');
}

export async function listCommentsHandler(req: Request, res: Response) {
  const comments = await helpdeskService.listComments(req.params.id as string, req.user!);
  return sendSuccess(res, comments);
}

export async function addCommentHandler(req: Request, res: Response) {
  const body = req.body as CreateTicketCommentInput;
  const comment = await helpdeskService.addComment(req.params.id as string, req.user!.sub, body, req.user!);
  return sendCreated(res, comment);
}
