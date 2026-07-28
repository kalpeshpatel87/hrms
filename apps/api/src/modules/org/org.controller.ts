import type { Request, Response } from 'express';
import { sendCreated, sendPaginated, sendSuccess } from '../../lib/response.js';
import * as orgService from './org.service.js';
import type {
  AuditLogQuery,
  BranchCreateInput,
  BranchQuery,
  BranchUpdateInput,
  CompanySettingUpsertInput,
  CompanySettingQuery,
  CompanyUpdateInput,
  DepartmentCreateInput,
  DepartmentQuery,
  DepartmentUpdateInput,
  DesignationCreateInput,
  DesignationQuery,
  DesignationUpdateInput,
  HolidayCreateInput,
  HolidayQuery,
  HolidayUpdateInput,
  ShiftCreateInput,
  ShiftQuery,
  ShiftUpdateInput,
  TeamCreateInput,
  TeamQuery,
  TeamUpdateInput,
} from './org.validation.js';

// ---------------------------------------------------------------------------
// Department
// ---------------------------------------------------------------------------

export async function listDepartmentsHandler(req: Request, res: Response) {
  const query = req.query as unknown as DepartmentQuery;
  const result = await orgService.listDepartments(query);
  return sendPaginated(res, result);
}

export async function getDepartmentHandler(req: Request, res: Response) {
  const department = await orgService.getDepartment((req.params.id as string));
  return sendSuccess(res, department);
}

export async function createDepartmentHandler(req: Request, res: Response) {
  const body = req.body as DepartmentCreateInput;
  const department = await orgService.createDepartment(body);
  return sendCreated(res, department);
}

export async function updateDepartmentHandler(req: Request, res: Response) {
  const body = req.body as DepartmentUpdateInput;
  const department = await orgService.updateDepartment((req.params.id as string), body);
  return sendSuccess(res, department, 'Department updated successfully');
}

export async function deleteDepartmentHandler(req: Request, res: Response) {
  await orgService.deleteDepartment((req.params.id as string));
  return sendSuccess(res, null, 'Department deleted successfully');
}

// ---------------------------------------------------------------------------
// Designation
// ---------------------------------------------------------------------------

export async function listDesignationsHandler(req: Request, res: Response) {
  const query = req.query as unknown as DesignationQuery;
  const result = await orgService.listDesignations(query);
  return sendPaginated(res, result);
}

export async function getDesignationHandler(req: Request, res: Response) {
  const designation = await orgService.getDesignation((req.params.id as string));
  return sendSuccess(res, designation);
}

export async function createDesignationHandler(req: Request, res: Response) {
  const body = req.body as DesignationCreateInput;
  const designation = await orgService.createDesignation(body);
  return sendCreated(res, designation);
}

export async function updateDesignationHandler(req: Request, res: Response) {
  const body = req.body as DesignationUpdateInput;
  const designation = await orgService.updateDesignation((req.params.id as string), body);
  return sendSuccess(res, designation, 'Designation updated successfully');
}

export async function deleteDesignationHandler(req: Request, res: Response) {
  await orgService.deleteDesignation((req.params.id as string));
  return sendSuccess(res, null, 'Designation deleted successfully');
}

// ---------------------------------------------------------------------------
// Branch
// ---------------------------------------------------------------------------

export async function listBranchesHandler(req: Request, res: Response) {
  const query = req.query as unknown as BranchQuery;
  const result = await orgService.listBranches(query);
  return sendPaginated(res, result);
}

export async function getBranchHandler(req: Request, res: Response) {
  const branch = await orgService.getBranch((req.params.id as string));
  return sendSuccess(res, branch);
}

export async function createBranchHandler(req: Request, res: Response) {
  const body = req.body as BranchCreateInput;
  const branch = await orgService.createBranch(body);
  return sendCreated(res, branch);
}

export async function updateBranchHandler(req: Request, res: Response) {
  const body = req.body as BranchUpdateInput;
  const branch = await orgService.updateBranch((req.params.id as string), body);
  return sendSuccess(res, branch, 'Branch updated successfully');
}

export async function deleteBranchHandler(req: Request, res: Response) {
  await orgService.deleteBranch((req.params.id as string));
  return sendSuccess(res, null, 'Branch deleted successfully');
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export async function listTeamsHandler(req: Request, res: Response) {
  const query = req.query as unknown as TeamQuery;
  const result = await orgService.listTeams(query);
  return sendPaginated(res, result);
}

export async function getTeamHandler(req: Request, res: Response) {
  const team = await orgService.getTeam((req.params.id as string));
  return sendSuccess(res, team);
}

export async function createTeamHandler(req: Request, res: Response) {
  const body = req.body as TeamCreateInput;
  const team = await orgService.createTeam(body);
  return sendCreated(res, team);
}

export async function updateTeamHandler(req: Request, res: Response) {
  const body = req.body as TeamUpdateInput;
  const team = await orgService.updateTeam((req.params.id as string), body);
  return sendSuccess(res, team, 'Team updated successfully');
}

export async function deleteTeamHandler(req: Request, res: Response) {
  await orgService.deleteTeam((req.params.id as string));
  return sendSuccess(res, null, 'Team deleted successfully');
}

// ---------------------------------------------------------------------------
// Shift
// ---------------------------------------------------------------------------

export async function listShiftsHandler(req: Request, res: Response) {
  const query = req.query as unknown as ShiftQuery;
  const result = await orgService.listShifts(query);
  return sendPaginated(res, result);
}

export async function getShiftHandler(req: Request, res: Response) {
  const shift = await orgService.getShift((req.params.id as string));
  return sendSuccess(res, shift);
}

export async function createShiftHandler(req: Request, res: Response) {
  const body = req.body as ShiftCreateInput;
  const shift = await orgService.createShift(body);
  return sendCreated(res, shift);
}

export async function updateShiftHandler(req: Request, res: Response) {
  const body = req.body as ShiftUpdateInput;
  const shift = await orgService.updateShift((req.params.id as string), body);
  return sendSuccess(res, shift, 'Shift updated successfully');
}

export async function deleteShiftHandler(req: Request, res: Response) {
  await orgService.deleteShift((req.params.id as string));
  return sendSuccess(res, null, 'Shift deleted successfully');
}

// ---------------------------------------------------------------------------
// Holiday
// ---------------------------------------------------------------------------

export async function listHolidaysHandler(req: Request, res: Response) {
  const query = req.query as unknown as HolidayQuery;
  const result = await orgService.listHolidays(query);
  return sendPaginated(res, result);
}

export async function getHolidayHandler(req: Request, res: Response) {
  const holiday = await orgService.getHoliday((req.params.id as string));
  return sendSuccess(res, holiday);
}

export async function createHolidayHandler(req: Request, res: Response) {
  const body = req.body as HolidayCreateInput;
  const holiday = await orgService.createHoliday(body);
  return sendCreated(res, holiday);
}

export async function updateHolidayHandler(req: Request, res: Response) {
  const body = req.body as HolidayUpdateInput;
  const holiday = await orgService.updateHoliday((req.params.id as string), body);
  return sendSuccess(res, holiday, 'Holiday updated successfully');
}

export async function deleteHolidayHandler(req: Request, res: Response) {
  await orgService.deleteHoliday((req.params.id as string));
  return sendSuccess(res, null, 'Holiday deleted successfully');
}

// ---------------------------------------------------------------------------
// Company (singleton) + CompanySetting
// ---------------------------------------------------------------------------

export async function getCompanyHandler(_req: Request, res: Response) {
  const company = await orgService.getCompany();
  return sendSuccess(res, company);
}

export async function updateCompanyHandler(req: Request, res: Response) {
  const body = req.body as CompanyUpdateInput;
  const company = await orgService.updateCompany(body);
  return sendSuccess(res, company, 'Company details updated successfully');
}

export async function listCompanySettingsHandler(req: Request, res: Response) {
  const query = req.query as unknown as CompanySettingQuery;
  const result = await orgService.listCompanySettings(query);
  return sendPaginated(res, result);
}

export async function getCompanySettingHandler(req: Request, res: Response) {
  const setting = await orgService.getCompanySetting((req.params.key as string));
  return sendSuccess(res, setting);
}

export async function upsertCompanySettingHandler(req: Request, res: Response) {
  const body = req.body as CompanySettingUpsertInput;
  const setting = await orgService.upsertCompanySetting((req.params.key as string), body);
  return sendSuccess(res, setting, 'Company setting saved successfully');
}

export async function listAuditLogsHandler(req: Request, res: Response) {
  const query = req.query as unknown as AuditLogQuery;
  const result = await orgService.listAuditLogs(query);
  return sendPaginated(res, result);
}
