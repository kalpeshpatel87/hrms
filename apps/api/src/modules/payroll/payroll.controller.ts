import type { Request, Response } from 'express';
import type { PaginationQuery } from '@atyantik/shared-types';
import { sendCreated, sendPaginated, sendSuccess } from '../../lib/response.js';
import * as payrollService from './payroll.service.js';
import type {
  CreateDeductionInput,
  CreatePayrollRunInput,
  CreateReimbursementInput,
  CreateSalaryStructureInput,
  DeductionQuery,
  PayrollRunQuery,
  ReimbursementDecisionInput,
  ReimbursementQuery,
} from './payroll.validation.js';

// ---------------------------------------------------------------------------
// Salary components / structures
// ---------------------------------------------------------------------------

export async function listSalaryComponentsHandler(req: Request, res: Response) {
  const query = req.query as unknown as PaginationQuery;
  const result = await payrollService.listSalaryComponents(req.user!.sub, query);
  return sendPaginated(res, result);
}

export async function getActiveSalaryStructureHandler(req: Request, res: Response) {
  const structure = await payrollService.getActiveSalaryStructure(req.params.employeeId as string);
  return sendSuccess(res, structure);
}

export async function createSalaryStructureHandler(req: Request, res: Response) {
  const body = req.body as CreateSalaryStructureInput;
  const structure = await payrollService.createSalaryStructure(body);
  return sendCreated(res, structure, 'Salary structure created successfully');
}

// ---------------------------------------------------------------------------
// Payroll runs
// ---------------------------------------------------------------------------

export async function createPayrollRunHandler(req: Request, res: Response) {
  const body = req.body as CreatePayrollRunInput;
  const run = await payrollService.createPayrollRun(req.user!.sub, body);
  return sendCreated(res, run, 'Payroll run generated successfully');
}

export async function approvePayrollRunHandler(req: Request, res: Response) {
  const run = await payrollService.approvePayrollRun(req.user!.sub, req.params.id as string);
  return sendSuccess(res, run, 'Payroll run approved successfully');
}

export async function listPayrollRunsHandler(req: Request, res: Response) {
  const query = req.query as unknown as PayrollRunQuery;
  const result = await payrollService.listPayrollRuns(req.user!.sub, query);
  return sendPaginated(res, result);
}

// ---------------------------------------------------------------------------
// Payslips
// ---------------------------------------------------------------------------

export async function listMyPayslipsHandler(req: Request, res: Response) {
  const query = req.query as unknown as PaginationQuery;
  const result = await payrollService.listMyPayslips(req.user!.sub, query);
  return sendPaginated(res, result);
}

export async function downloadPayslipHandler(req: Request, res: Response) {
  const { buffer, fileName } = await payrollService.getPayslipPdf(req.params.id as string, req.user!);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  return res.send(buffer);
}

// ---------------------------------------------------------------------------
// Reimbursements
// ---------------------------------------------------------------------------

export async function listReimbursementsHandler(req: Request, res: Response) {
  const query = req.query as unknown as ReimbursementQuery;
  const result = await payrollService.listReimbursements(query);
  return sendPaginated(res, result);
}

export async function createReimbursementHandler(req: Request, res: Response) {
  const body = req.body as CreateReimbursementInput;
  const reimbursement = await payrollService.createReimbursement(body);
  return sendCreated(res, reimbursement);
}

export async function decideReimbursementHandler(req: Request, res: Response) {
  const body = req.body as ReimbursementDecisionInput;
  const reimbursement = await payrollService.decideReimbursement(req.user!.sub, req.params.id as string, body);
  return sendSuccess(res, reimbursement, 'Reimbursement decision recorded');
}

// ---------------------------------------------------------------------------
// Deductions
// ---------------------------------------------------------------------------

export async function listDeductionsHandler(req: Request, res: Response) {
  const query = req.query as unknown as DeductionQuery;
  const result = await payrollService.listDeductions(query);
  return sendPaginated(res, result);
}

export async function createDeductionHandler(req: Request, res: Response) {
  const body = req.body as CreateDeductionInput;
  const deduction = await payrollService.createDeduction(body);
  return sendCreated(res, deduction);
}
