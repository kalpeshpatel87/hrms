import type { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { recordAuditLog } from '../../lib/auditLog.js';
import { buildPagination } from '../../lib/response.js';
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

async function resolveCompanyId(): Promise<string> {
  const company = await prisma.company.findFirst({ select: { id: true } });
  if (!company) throw ApiError.badRequest('No company record exists yet');
  return company.id;
}

async function resolveEmployeeForUser(userId: string) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw ApiError.badRequest('No employee profile is linked to this account');
  return employee;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export async function listClients(query: { page: number; pageSize: number; search?: string }) {
  const where: Prisma.ClientWhereInput = query.search
    ? { name: { contains: query.search, mode: 'insensitive' } }
    : {};
  const [items, total] = await Promise.all([
    prisma.client.findMany({ where, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
    prisma.client.count({ where }),
  ]);
  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function createClient(input: ClientInput) {
  const companyId = await resolveCompanyId();
  const client = await prisma.client.create({ data: { ...input, companyId } });
  await recordAuditLog({ action: 'CREATE', entityType: 'Client', entityId: client.id, after: client });
  return client;
}

export async function updateClient(id: string, input: UpdateClientInput) {
  const before = await prisma.client.findUnique({ where: { id } });
  if (!before) throw ApiError.notFound('Client not found');
  const updated = await prisma.client.update({ where: { id }, data: input });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Client', entityId: id, before, after: updated });
  return updated;
}

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

const projectInclude = { client: true } satisfies Prisma.ProjectInclude;

export async function listProjects(query: ProjectQuery) {
  const where: Prisma.ProjectWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { code: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.project.count({ where }),
  ]);
  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function createProject(input: ProjectInput) {
  const companyId = await resolveCompanyId();
  const project = await prisma.project.create({ data: { ...input, companyId }, include: projectInclude });
  await recordAuditLog({ action: 'CREATE', entityType: 'Project', entityId: project.id, after: project });
  return project;
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  const before = await prisma.project.findUnique({ where: { id } });
  if (!before) throw ApiError.notFound('Project not found');
  const updated = await prisma.project.update({ where: { id }, data: input, include: projectInclude });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Project', entityId: id, before, after: updated });
  return updated;
}

export async function assignToProject(projectId: string, input: ProjectAssignmentInput) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw ApiError.notFound('Project not found');

  const assignment = await prisma.projectAssignment.create({ data: { ...input, projectId } });
  await recordAuditLog({ action: 'CREATE', entityType: 'ProjectAssignment', entityId: assignment.id, after: assignment });
  return assignment;
}

export async function listProjectAssignments(projectId: string) {
  return prisma.projectAssignment.findMany({
    where: { projectId },
    include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } } },
  });
}

// ---------------------------------------------------------------------------
// Timesheet
// ---------------------------------------------------------------------------

const timesheetInclude = { entries: { include: { project: true } } } satisfies Prisma.TimesheetInclude;

export async function createOrUpdateTimesheet(userId: string, input: CreateTimesheetInput) {
  const employee = await resolveEmployeeForUser(userId);

  const existing = await prisma.timesheet.findUnique({
    where: { employeeId_weekStartDate: { employeeId: employee.id, weekStartDate: input.weekStartDate } },
  });
  if (existing && existing.status !== 'DRAFT') {
    throw ApiError.conflict('This timesheet has already been submitted and can no longer be edited');
  }

  const timesheet = await prisma.$transaction(async (tx) => {
    const record =
      existing ??
      (await tx.timesheet.create({ data: { employeeId: employee.id, weekStartDate: input.weekStartDate } }));

    await tx.timesheetEntry.deleteMany({ where: { timesheetId: record.id } });
    if (input.entries.length > 0) {
      await tx.timesheetEntry.createMany({
        data: input.entries.map((entry) => ({ ...entry, timesheetId: record.id })),
      });
    }

    return tx.timesheet.findUniqueOrThrow({ where: { id: record.id }, include: timesheetInclude });
  });

  await recordAuditLog({ action: existing ? 'UPDATE' : 'CREATE', entityType: 'Timesheet', entityId: timesheet.id, after: timesheet });
  return timesheet;
}

export async function submitTimesheet(userId: string, timesheetId: string) {
  const employee = await resolveEmployeeForUser(userId);
  const timesheet = await prisma.timesheet.findFirst({ where: { id: timesheetId, employeeId: employee.id } });
  if (!timesheet) throw ApiError.notFound('Timesheet not found');
  if (timesheet.status !== 'DRAFT') throw ApiError.conflict('Only draft timesheets can be submitted');

  const updated = await prisma.timesheet.update({
    where: { id: timesheetId },
    data: { status: 'SUBMITTED', submittedAt: new Date() },
    include: timesheetInclude,
  });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Timesheet', entityId: timesheetId, after: updated });
  return updated;
}

export async function decideTimesheet(userId: string, timesheetId: string, approve: boolean) {
  const timesheet = await prisma.timesheet.findUnique({ where: { id: timesheetId } });
  if (!timesheet) throw ApiError.notFound('Timesheet not found');
  if (timesheet.status !== 'SUBMITTED') throw ApiError.conflict('This timesheet is not pending approval');

  const updated = await prisma.timesheet.update({
    where: { id: timesheetId },
    data: { status: approve ? 'APPROVED' : 'REJECTED', approvedById: userId, approvedAt: new Date() },
    include: timesheetInclude,
  });
  await recordAuditLog({
    action: approve ? 'APPROVE' : 'REJECT',
    entityType: 'Timesheet',
    entityId: timesheetId,
    before: { status: timesheet.status },
    after: { status: updated.status },
  });
  return updated;
}

export async function listMyTimesheets(userId: string, query: TimesheetQuery) {
  const employee = await resolveEmployeeForUser(userId);
  const where: Prisma.TimesheetWhereInput = { employeeId: employee.id };
  if (query.status) where.status = query.status;

  const [items, total] = await Promise.all([
    prisma.timesheet.findMany({
      where,
      include: timesheetInclude,
      orderBy: { weekStartDate: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.timesheet.count({ where }),
  ]);
  return { items, ...buildPagination(total, query.page, query.pageSize) };
}
