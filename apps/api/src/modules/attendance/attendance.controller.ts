import type { Request, Response } from 'express';
import { sendCreated, sendPaginated, sendSuccess } from '../../lib/response.js';
import * as attendanceService from './attendance.service.js';
import type {
  AttendanceQuery,
  BreakInInput,
  CheckInInput,
  CheckOutInput,
  CorrectionRequestQuery,
  CreateCorrectionRequestInput,
  MyAttendanceQuery,
  UpdateAttendanceInput,
} from './attendance.validation.js';

function requestMeta(req: Request) {
  return { ipAddress: req.ip };
}

export async function checkInHandler(req: Request, res: Response) {
  const body = req.body as CheckInInput;
  const record = await attendanceService.checkIn(req.user!.sub, body, requestMeta(req));
  return sendCreated(res, record, 'Checked in successfully');
}

export async function checkOutHandler(req: Request, res: Response) {
  const body = req.body as CheckOutInput;
  const record = await attendanceService.checkOut(req.user!.sub, body, requestMeta(req));
  return sendSuccess(res, record, 'Checked out successfully');
}

export async function breakInHandler(req: Request, res: Response) {
  const body = req.body as BreakInInput;
  const breakRow = await attendanceService.breakIn(req.user!.sub, body);
  return sendCreated(res, breakRow, 'Break started');
}

export async function breakOutHandler(req: Request, res: Response) {
  const record = await attendanceService.breakOut(req.user!.sub);
  return sendSuccess(res, record, 'Break ended');
}

export async function getMyAttendanceHandler(req: Request, res: Response) {
  const query = req.query as unknown as MyAttendanceQuery;
  const records = await attendanceService.getMyAttendance(req.user!.sub, query.month, query.year);
  return sendSuccess(res, records);
}

export async function listAttendanceHandler(req: Request, res: Response) {
  const query = req.query as unknown as AttendanceQuery;
  const result = await attendanceService.listAttendance(query);
  return sendPaginated(res, result);
}

export async function updateAttendanceHandler(req: Request, res: Response) {
  const body = req.body as UpdateAttendanceInput;
  const record = await attendanceService.updateAttendance(req.params.id as string, body);
  return sendSuccess(res, record, 'Attendance record updated');
}

export async function createCorrectionRequestHandler(req: Request, res: Response) {
  const body = req.body as CreateCorrectionRequestInput;
  const correctionRequest = await attendanceService.createCorrectionRequest(req.user!.sub, body);
  return sendCreated(res, correctionRequest, 'Correction request submitted');
}

export async function listCorrectionRequestsHandler(req: Request, res: Response) {
  const query = req.query as unknown as CorrectionRequestQuery;
  const result = await attendanceService.listCorrectionRequests(query);
  return sendPaginated(res, result);
}

export async function approveCorrectionRequestHandler(req: Request, res: Response) {
  const result = await attendanceService.approveCorrectionRequest(req.params.id as string, req.user!.sub);
  return sendSuccess(res, result, 'Correction request approved');
}

export async function rejectCorrectionRequestHandler(req: Request, res: Response) {
  const result = await attendanceService.rejectCorrectionRequest(req.params.id as string, req.user!.sub);
  return sendSuccess(res, result, 'Correction request rejected');
}
