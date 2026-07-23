import type { Request, Response } from 'express';
import { sendSuccess } from '../../lib/response.js';
import * as reportService from './report.service.js';
import type { MonthYearQuery, YearQuery } from './report.validation.js';

export async function headcountByDepartmentHandler(_req: Request, res: Response) {
  const result = await reportService.getHeadcountByDepartment();
  return sendSuccess(res, result);
}

export async function attendanceSummaryHandler(req: Request, res: Response) {
  const { month, year } = req.query as unknown as MonthYearQuery;
  const result = await reportService.getAttendanceSummary(month, year);
  return sendSuccess(res, result);
}

export async function leaveSummaryHandler(req: Request, res: Response) {
  const { year } = req.query as unknown as YearQuery;
  const result = await reportService.getLeaveSummary(year);
  return sendSuccess(res, result);
}

export async function payrollSummaryHandler(req: Request, res: Response) {
  const { year } = req.query as unknown as YearQuery;
  const result = await reportService.getPayrollSummary(year);
  return sendSuccess(res, result);
}
