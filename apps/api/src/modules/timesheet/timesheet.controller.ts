import type { Request, Response } from 'express';
import type { PaginationQuery } from '@atyantik/shared-types';
import { sendCreated, sendPaginated, sendSuccess } from '../../lib/response.js';
import * as timesheetService from './timesheet.service.js';
import type {
  ClientInput,
  CreateTimesheetInput,
  ProjectAssignmentInput,
  ProjectInput,
  ProjectQuery,
  TimesheetQuery,
  UpdateClientInput,
  UpdateProjectInput,
} from './timesheet.validation.js';

export async function listClientsHandler(req: Request, res: Response) {
  const query = req.query as unknown as PaginationQuery;
  const result = await timesheetService.listClients(query);
  return sendPaginated(res, result);
}

export async function createClientHandler(req: Request, res: Response) {
  const body = req.body as ClientInput;
  const client = await timesheetService.createClient(body);
  return sendCreated(res, client);
}

export async function updateClientHandler(req: Request, res: Response) {
  const body = req.body as UpdateClientInput;
  const client = await timesheetService.updateClient(req.params.id as string, body);
  return sendSuccess(res, client, 'Client updated successfully');
}

export async function listProjectsHandler(req: Request, res: Response) {
  const query = req.query as unknown as ProjectQuery;
  const result = await timesheetService.listProjects(query);
  return sendPaginated(res, result);
}

export async function createProjectHandler(req: Request, res: Response) {
  const body = req.body as ProjectInput;
  const project = await timesheetService.createProject(body);
  return sendCreated(res, project);
}

export async function updateProjectHandler(req: Request, res: Response) {
  const body = req.body as UpdateProjectInput;
  const project = await timesheetService.updateProject(req.params.id as string, body);
  return sendSuccess(res, project, 'Project updated successfully');
}

export async function assignToProjectHandler(req: Request, res: Response) {
  const body = req.body as ProjectAssignmentInput;
  const assignment = await timesheetService.assignToProject(req.params.id as string, body);
  return sendCreated(res, assignment);
}

export async function listProjectAssignmentsHandler(req: Request, res: Response) {
  const assignments = await timesheetService.listProjectAssignments(req.params.id as string);
  return sendSuccess(res, assignments);
}

export async function createOrUpdateTimesheetHandler(req: Request, res: Response) {
  const body = req.body as CreateTimesheetInput;
  const timesheet = await timesheetService.createOrUpdateTimesheet(req.user!.sub, body);
  return sendSuccess(res, timesheet, 'Timesheet saved successfully');
}

export async function submitTimesheetHandler(req: Request, res: Response) {
  const timesheet = await timesheetService.submitTimesheet(req.user!.sub, req.params.id as string);
  return sendSuccess(res, timesheet, 'Timesheet submitted successfully');
}

export async function approveTimesheetHandler(req: Request, res: Response) {
  const timesheet = await timesheetService.decideTimesheet(req.user!.sub, req.params.id as string, true);
  return sendSuccess(res, timesheet, 'Timesheet approved successfully');
}

export async function rejectTimesheetHandler(req: Request, res: Response) {
  const timesheet = await timesheetService.decideTimesheet(req.user!.sub, req.params.id as string, false);
  return sendSuccess(res, timesheet, 'Timesheet rejected');
}

export async function listMyTimesheetsHandler(req: Request, res: Response) {
  const query = req.query as unknown as TimesheetQuery;
  const result = await timesheetService.listMyTimesheets(req.user!.sub, query);
  return sendPaginated(res, result);
}
