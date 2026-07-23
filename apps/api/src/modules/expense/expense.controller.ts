import type { Request, Response } from 'express';
import { sendCreated, sendPaginated, sendSuccess } from '../../lib/response.js';
import * as expenseService from './expense.service.js';
import type { CreateExpenseClaimInput, ExpenseClaimQuery, ExpenseDecisionInput } from './expense.validation.js';

export async function createExpenseClaimHandler(req: Request, res: Response) {
  const body = req.body as CreateExpenseClaimInput;
  const claim = await expenseService.createExpenseClaim(req.user!.sub, body);
  return sendCreated(res, claim);
}

export async function submitExpenseClaimHandler(req: Request, res: Response) {
  const claim = await expenseService.submitExpenseClaim(req.user!.sub, req.params.id as string);
  return sendSuccess(res, claim, 'Expense claim submitted successfully');
}

export async function listMyExpenseClaimsHandler(req: Request, res: Response) {
  const query = req.query as unknown as ExpenseClaimQuery;
  const result = await expenseService.listMyExpenseClaims(req.user!.sub, query);
  return sendPaginated(res, result);
}

export async function listExpenseClaimsHandler(req: Request, res: Response) {
  const query = req.query as unknown as ExpenseClaimQuery;
  const result = await expenseService.listExpenseClaims(query);
  return sendPaginated(res, result);
}

export async function decideExpenseClaimHandler(req: Request, res: Response) {
  const body = req.body as ExpenseDecisionInput;
  const claim = await expenseService.decideExpenseClaim(req.user!.sub, req.params.id as string, body);
  return sendSuccess(res, claim, 'Expense claim decision recorded');
}
