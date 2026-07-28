import { prisma, softDelete } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { recordAuditLog } from '../../lib/auditLog.js';
import type { PaginatedResult, PaginationQuery } from '@atyantik/shared-types';
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

function buildOrderBy(query: PaginationQuery, allowedFields: string[], fallback: string) {
  const field = query.sortBy && allowedFields.includes(query.sortBy) ? query.sortBy : fallback;
  return { [field]: query.sortDir };
}

function pageSlice(query: PaginationQuery) {
  return { skip: (query.page - 1) * query.pageSize, take: query.pageSize };
}

/** This deployment carries exactly one Company row — resolve it instead of asking clients for a companyId. */
export async function getDefaultCompanyId(): Promise<string> {
  const company = await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!company) throw ApiError.notFound('No company is configured for this deployment yet');
  return company.id;
}

// ---------------------------------------------------------------------------
// Department (self-relation: parentDepartmentId / subDepartments, headEmployeeId)
// ---------------------------------------------------------------------------

async function assertEmployeeExists(employeeId: string, field: string) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw ApiError.badRequest(`${field} does not reference an existing employee`);
}

/** Walks the parent chain to make sure assigning `parentDepartmentId` to `departmentId` would not create a cycle. */
async function assertNoDepartmentCycle(departmentId: string, parentDepartmentId: string) {
  if (departmentId === parentDepartmentId) {
    throw ApiError.badRequest('A department cannot be its own parent');
  }
  let cursor: string | null = parentDepartmentId;
  const seen = new Set<string>();
  while (cursor) {
    if (cursor === departmentId) {
      throw ApiError.badRequest('This would create a circular department hierarchy');
    }
    if (seen.has(cursor)) break; // defensive: pre-existing corrupt data, avoid infinite loop
    seen.add(cursor);
    const parent: { parentDepartmentId: string | null } | null = await prisma.department.findUnique({
      where: { id: cursor },
      select: { parentDepartmentId: true },
    });
    cursor = parent?.parentDepartmentId ?? null;
  }
}

export async function listDepartments(query: DepartmentQuery): Promise<PaginatedResult<unknown>> {
  const companyId = await getDefaultCompanyId();
  const where: Record<string, unknown> = { companyId };
  if (query.parentDepartmentId) where.parentDepartmentId = query.parentDepartmentId;
  if (query.rootOnly) where.parentDepartmentId = null;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { code: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.department.findMany({
      where,
      orderBy: buildOrderBy(query, ['name', 'code', 'createdAt'], 'name'),
      ...pageSlice(query),
      include: {
        parentDepartment: true,
        headEmployee: true,
        // Displayed as the department's "Employees" count — only count active, non-deactivated
        // employees (this is a display count, unlike the delete-guard `_count.employees` checks
        // elsewhere in this file, which intentionally count everyone still assigned).
        _count: { select: { subDepartments: true, employees: { where: { deletedAt: null, user: { isActive: true } } } } },
      },
    }),
    prisma.department.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) };
}

export async function getDepartment(id: string) {
  const department = await prisma.department.findUnique({
    where: { id },
    include: { parentDepartment: true, subDepartments: true, headEmployee: true, designations: true, teams: true },
  });
  if (!department) throw ApiError.notFound('Department not found');
  return department;
}

export async function createDepartment(input: DepartmentCreateInput) {
  const companyId = await getDefaultCompanyId();

  const existing = await prisma.department.findFirst({ where: { companyId, code: input.code } });
  if (existing) throw ApiError.conflict(`A department with code "${input.code}" already exists`);

  if (input.parentDepartmentId) {
    const parent = await prisma.department.findUnique({ where: { id: input.parentDepartmentId } });
    if (!parent) throw ApiError.badRequest('parentDepartmentId does not reference an existing department');
  }
  if (input.headEmployeeId) await assertEmployeeExists(input.headEmployeeId, 'headEmployeeId');

  const department = await prisma.department.create({
    data: {
      companyId,
      name: input.name,
      code: input.code,
      parentDepartmentId: input.parentDepartmentId ?? undefined,
      headEmployeeId: input.headEmployeeId ?? undefined,
    },
  });
  await recordAuditLog({ action: 'CREATE', entityType: 'Department', entityId: department.id, after: department });
  return department;
}

export async function updateDepartment(id: string, input: DepartmentUpdateInput) {
  const before = await prisma.department.findUnique({ where: { id } });
  if (!before) throw ApiError.notFound('Department not found');

  if (input.code && input.code !== before.code) {
    const clash = await prisma.department.findFirst({ where: { companyId: before.companyId, code: input.code, NOT: { id } } });
    if (clash) throw ApiError.conflict(`A department with code "${input.code}" already exists`);
  }
  if (input.parentDepartmentId !== undefined && input.parentDepartmentId !== null) {
    const parent = await prisma.department.findUnique({ where: { id: input.parentDepartmentId } });
    if (!parent) throw ApiError.badRequest('parentDepartmentId does not reference an existing department');
    await assertNoDepartmentCycle(id, input.parentDepartmentId);
  }
  if (input.headEmployeeId) await assertEmployeeExists(input.headEmployeeId, 'headEmployeeId');

  const department = await prisma.department.update({
    where: { id },
    data: {
      name: input.name,
      code: input.code,
      parentDepartmentId: input.parentDepartmentId,
      headEmployeeId: input.headEmployeeId,
    },
  });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Department', entityId: id, before, after: department });
  return department;
}

export async function deleteDepartment(id: string) {
  const department = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { subDepartments: true, employees: true } } },
  });
  if (!department) throw ApiError.notFound('Department not found');
  if (department._count.subDepartments > 0) {
    throw ApiError.conflict('Cannot delete a department that has sub-departments — reassign or delete them first');
  }
  if (department._count.employees > 0) {
    throw ApiError.conflict('Cannot delete a department that still has employees assigned to it');
  }

  await softDelete('Department', id);
  await recordAuditLog({ action: 'DELETE', entityType: 'Department', entityId: id, before: department });
}

// ---------------------------------------------------------------------------
// Designation
// ---------------------------------------------------------------------------

export async function listDesignations(query: DesignationQuery): Promise<PaginatedResult<unknown>> {
  const where: Record<string, unknown> = {};
  if (query.departmentId) where.departmentId = query.departmentId;
  if (query.search) where.title = { contains: query.search, mode: 'insensitive' };

  const [items, total] = await Promise.all([
    prisma.designation.findMany({
      where,
      orderBy: buildOrderBy(query, ['title', 'level', 'createdAt'], 'title'),
      ...pageSlice(query),
      include: { department: true },
    }),
    prisma.designation.count({ where }),
  ]);
  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) };
}

export async function getDesignation(id: string) {
  const designation = await prisma.designation.findUnique({ where: { id }, include: { department: true } });
  if (!designation) throw ApiError.notFound('Designation not found');
  return designation;
}

export async function createDesignation(input: DesignationCreateInput) {
  if (input.departmentId) {
    const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
    if (!department) throw ApiError.badRequest('departmentId does not reference an existing department');
  }
  const designation = await prisma.designation.create({
    data: { title: input.title, level: input.level ?? undefined, departmentId: input.departmentId ?? undefined },
  });
  await recordAuditLog({ action: 'CREATE', entityType: 'Designation', entityId: designation.id, after: designation });
  return designation;
}

export async function updateDesignation(id: string, input: DesignationUpdateInput) {
  const before = await prisma.designation.findUnique({ where: { id } });
  if (!before) throw ApiError.notFound('Designation not found');
  if (input.departmentId) {
    const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
    if (!department) throw ApiError.badRequest('departmentId does not reference an existing department');
  }
  const designation = await prisma.designation.update({
    where: { id },
    data: { title: input.title, level: input.level, departmentId: input.departmentId },
  });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Designation', entityId: id, before, after: designation });
  return designation;
}

export async function deleteDesignation(id: string) {
  const designation = await prisma.designation.findUnique({ where: { id }, include: { _count: { select: { employees: true } } } });
  if (!designation) throw ApiError.notFound('Designation not found');
  if (designation._count.employees > 0) {
    throw ApiError.conflict('Cannot delete a designation that still has employees assigned to it');
  }
  await softDelete('Designation', id);
  await recordAuditLog({ action: 'DELETE', entityType: 'Designation', entityId: id, before: designation });
}

// ---------------------------------------------------------------------------
// Branch
// ---------------------------------------------------------------------------

export async function listBranches(query: BranchQuery): Promise<PaginatedResult<unknown>> {
  const companyId = await getDefaultCompanyId();
  const where: Record<string, unknown> = { companyId };
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { code: { contains: query.search, mode: 'insensitive' } },
      { city: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.branch.findMany({ where, orderBy: buildOrderBy(query, ['name', 'code', 'createdAt'], 'name'), ...pageSlice(query) }),
    prisma.branch.count({ where }),
  ]);
  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) };
}

export async function getBranch(id: string) {
  const branch = await prisma.branch.findUnique({ where: { id } });
  if (!branch) throw ApiError.notFound('Branch not found');
  return branch;
}

export async function createBranch(input: BranchCreateInput) {
  const companyId = await getDefaultCompanyId();
  const existing = await prisma.branch.findFirst({ where: { companyId, code: input.code } });
  if (existing) throw ApiError.conflict(`A branch with code "${input.code}" already exists`);

  const branch = await prisma.branch.create({ data: { companyId, ...input } });
  await recordAuditLog({ action: 'CREATE', entityType: 'Branch', entityId: branch.id, after: branch });
  return branch;
}

export async function updateBranch(id: string, input: BranchUpdateInput) {
  const before = await prisma.branch.findUnique({ where: { id } });
  if (!before) throw ApiError.notFound('Branch not found');
  if (input.code && input.code !== before.code) {
    const clash = await prisma.branch.findFirst({ where: { companyId: before.companyId, code: input.code, NOT: { id } } });
    if (clash) throw ApiError.conflict(`A branch with code "${input.code}" already exists`);
  }
  const branch = await prisma.branch.update({ where: { id }, data: input });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Branch', entityId: id, before, after: branch });
  return branch;
}

export async function deleteBranch(id: string) {
  const branch = await prisma.branch.findUnique({ where: { id }, include: { _count: { select: { employees: true } } } });
  if (!branch) throw ApiError.notFound('Branch not found');
  if (branch._count.employees > 0) {
    throw ApiError.conflict('Cannot delete a branch that still has employees assigned to it');
  }
  await softDelete('Branch', id);
  await recordAuditLog({ action: 'DELETE', entityType: 'Branch', entityId: id, before: branch });
}

// ---------------------------------------------------------------------------
// Team (leadEmployeeId)
// ---------------------------------------------------------------------------

export async function listTeams(query: TeamQuery): Promise<PaginatedResult<unknown>> {
  const where: Record<string, unknown> = {};
  if (query.departmentId) where.departmentId = query.departmentId;
  if (query.search) where.name = { contains: query.search, mode: 'insensitive' };

  const [items, total] = await Promise.all([
    prisma.team.findMany({
      where,
      orderBy: buildOrderBy(query, ['name', 'createdAt'], 'name'),
      ...pageSlice(query),
      include: { department: true, leadEmployee: true, _count: { select: { members: true } } },
    }),
    prisma.team.count({ where }),
  ]);
  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) };
}

export async function getTeam(id: string) {
  const team = await prisma.team.findUnique({
    where: { id },
    include: { department: true, leadEmployee: true, members: true },
  });
  if (!team) throw ApiError.notFound('Team not found');
  return team;
}

export async function createTeam(input: TeamCreateInput) {
  if (input.departmentId) {
    const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
    if (!department) throw ApiError.badRequest('departmentId does not reference an existing department');
  }
  if (input.leadEmployeeId) await assertEmployeeExists(input.leadEmployeeId, 'leadEmployeeId');

  const team = await prisma.team.create({
    data: { name: input.name, departmentId: input.departmentId ?? undefined, leadEmployeeId: input.leadEmployeeId ?? undefined },
  });
  await recordAuditLog({ action: 'CREATE', entityType: 'Team', entityId: team.id, after: team });
  return team;
}

export async function updateTeam(id: string, input: TeamUpdateInput) {
  const before = await prisma.team.findUnique({ where: { id } });
  if (!before) throw ApiError.notFound('Team not found');
  if (input.departmentId) {
    const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
    if (!department) throw ApiError.badRequest('departmentId does not reference an existing department');
  }
  if (input.leadEmployeeId) await assertEmployeeExists(input.leadEmployeeId, 'leadEmployeeId');

  const team = await prisma.team.update({
    where: { id },
    data: { name: input.name, departmentId: input.departmentId, leadEmployeeId: input.leadEmployeeId },
  });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Team', entityId: id, before, after: team });
  return team;
}

export async function deleteTeam(id: string) {
  const team = await prisma.team.findUnique({ where: { id }, include: { _count: { select: { members: true } } } });
  if (!team) throw ApiError.notFound('Team not found');
  if (team._count.members > 0) {
    throw ApiError.conflict('Cannot delete a team that still has members assigned to it');
  }
  await softDelete('Team', id);
  await recordAuditLog({ action: 'DELETE', entityType: 'Team', entityId: id, before: team });
}

// ---------------------------------------------------------------------------
// Shift
// ---------------------------------------------------------------------------

export async function listShifts(query: ShiftQuery): Promise<PaginatedResult<unknown>> {
  const companyId = await getDefaultCompanyId();
  const where: Record<string, unknown> = { companyId };
  if (query.search) where.name = { contains: query.search, mode: 'insensitive' };

  const [items, total] = await Promise.all([
    prisma.shift.findMany({ where, orderBy: buildOrderBy(query, ['name', 'createdAt'], 'name'), ...pageSlice(query) }),
    prisma.shift.count({ where }),
  ]);
  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) };
}

export async function getShift(id: string) {
  const shift = await prisma.shift.findUnique({ where: { id } });
  if (!shift) throw ApiError.notFound('Shift not found');
  return shift;
}

export async function createShift(input: ShiftCreateInput) {
  const companyId = await getDefaultCompanyId();
  const shift = await prisma.shift.create({ data: { companyId, ...input } });
  await recordAuditLog({ action: 'CREATE', entityType: 'Shift', entityId: shift.id, after: shift });
  return shift;
}

export async function updateShift(id: string, input: ShiftUpdateInput) {
  const before = await prisma.shift.findUnique({ where: { id } });
  if (!before) throw ApiError.notFound('Shift not found');
  const shift = await prisma.shift.update({ where: { id }, data: input });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Shift', entityId: id, before, after: shift });
  return shift;
}

export async function deleteShift(id: string) {
  const shift = await prisma.shift.findUnique({ where: { id }, include: { _count: { select: { employees: true } } } });
  if (!shift) throw ApiError.notFound('Shift not found');
  if (shift._count.employees > 0) {
    throw ApiError.conflict('Cannot delete a shift that still has employees assigned to it');
  }
  await softDelete('Shift', id);
  await recordAuditLog({ action: 'DELETE', entityType: 'Shift', entityId: id, before: shift });
}

// ---------------------------------------------------------------------------
// Holiday
// ---------------------------------------------------------------------------

export async function listHolidays(query: HolidayQuery): Promise<PaginatedResult<unknown>> {
  const companyId = await getDefaultCompanyId();
  const where: Record<string, unknown> = { companyId };
  if (query.branchId) where.branchId = query.branchId;
  if (query.type) where.type = query.type;
  if (query.search) where.name = { contains: query.search, mode: 'insensitive' };
  if (query.dateFrom || query.dateTo) {
    where.date = {
      ...(query.dateFrom ? { gte: query.dateFrom } : {}),
      ...(query.dateTo ? { lte: query.dateTo } : {}),
    };
  }

  const [items, total] = await Promise.all([
    prisma.holiday.findMany({
      where,
      orderBy: buildOrderBy(query, ['date', 'name', 'createdAt'], 'date'),
      ...pageSlice(query),
      include: { branch: true },
    }),
    prisma.holiday.count({ where }),
  ]);
  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) };
}

export async function getHoliday(id: string) {
  const holiday = await prisma.holiday.findUnique({ where: { id }, include: { branch: true } });
  if (!holiday) throw ApiError.notFound('Holiday not found');
  return holiday;
}

export async function createHoliday(input: HolidayCreateInput) {
  const companyId = await getDefaultCompanyId();
  if (input.branchId) {
    const branch = await prisma.branch.findUnique({ where: { id: input.branchId } });
    if (!branch) throw ApiError.badRequest('branchId does not reference an existing branch');
  }
  const holiday = await prisma.holiday.create({
    data: {
      companyId,
      branchId: input.branchId ?? undefined,
      name: input.name,
      date: input.date,
      type: input.type,
      isOptional: input.isOptional,
    },
  });
  await recordAuditLog({ action: 'CREATE', entityType: 'Holiday', entityId: holiday.id, after: holiday });
  return holiday;
}

export async function updateHoliday(id: string, input: HolidayUpdateInput) {
  const before = await prisma.holiday.findUnique({ where: { id } });
  if (!before) throw ApiError.notFound('Holiday not found');
  if (input.branchId) {
    const branch = await prisma.branch.findUnique({ where: { id: input.branchId } });
    if (!branch) throw ApiError.badRequest('branchId does not reference an existing branch');
  }
  const holiday = await prisma.holiday.update({
    where: { id },
    data: { branchId: input.branchId, name: input.name, date: input.date, type: input.type, isOptional: input.isOptional },
  });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Holiday', entityId: id, before, after: holiday });
  return holiday;
}

export async function deleteHoliday(id: string) {
  const holiday = await prisma.holiday.findUnique({ where: { id } });
  if (!holiday) throw ApiError.notFound('Holiday not found');
  await softDelete('Holiday', id);
  await recordAuditLog({ action: 'DELETE', entityType: 'Holiday', entityId: id, before: holiday });
}

// ---------------------------------------------------------------------------
// Company (singleton)
// ---------------------------------------------------------------------------

export async function getCompany() {
  const company = await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!company) throw ApiError.notFound('No company is configured for this deployment yet');
  return company;
}

export async function updateCompany(input: CompanyUpdateInput) {
  const before = await getCompany();
  const company = await prisma.company.update({ where: { id: before.id }, data: input });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Company', entityId: company.id, before, after: company });
  return company;
}

// ---------------------------------------------------------------------------
// CompanySetting (key/value pairs)
// ---------------------------------------------------------------------------

export async function listCompanySettings(query: CompanySettingQuery): Promise<PaginatedResult<unknown>> {
  const companyId = await getDefaultCompanyId();
  const where: Record<string, unknown> = { companyId };
  if (query.search) where.key = { contains: query.search, mode: 'insensitive' };

  const [items, total] = await Promise.all([
    prisma.companySetting.findMany({ where, orderBy: buildOrderBy(query, ['key', 'createdAt'], 'key'), ...pageSlice(query) }),
    prisma.companySetting.count({ where }),
  ]);
  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) };
}

export async function getCompanySetting(key: string) {
  const companyId = await getDefaultCompanyId();
  const setting = await prisma.companySetting.findUnique({ where: { companyId_key: { companyId, key } } });
  if (!setting) throw ApiError.notFound(`No company setting found for key "${key}"`);
  return setting;
}

/** Upserts a single key/value pair — the natural "set a setting" operation for this resource. */
export async function upsertCompanySetting(key: string, input: CompanySettingUpsertInput) {
  const companyId = await getDefaultCompanyId();
  const before = await prisma.companySetting.findUnique({ where: { companyId_key: { companyId, key } } });

  const setting = await prisma.companySetting.upsert({
    where: { companyId_key: { companyId, key } },
    create: { companyId, key, value: input.value as object },
    update: { value: input.value as object },
  });
  await recordAuditLog({
    action: before ? 'UPDATE' : 'CREATE',
    entityType: 'CompanySetting',
    entityId: setting.id,
    before: before ?? undefined,
    after: setting,
  });
  return setting;
}

// ---------------------------------------------------------------------------
// AuditLog (read-only)
// ---------------------------------------------------------------------------

export async function listAuditLogs(query: AuditLogQuery): Promise<PaginatedResult<unknown>> {
  const { page, pageSize, entityType, actorId, dateFrom, dateTo } = query;

  const where: Record<string, unknown> = {
    ...(entityType && { entityType }),
    ...(actorId && { actorId }),
    ...((dateFrom || dateTo) && {
      createdAt: {
        ...(dateFrom && { gte: dateFrom }),
        ...(dateTo && { lte: dateTo }),
      },
    }),
  };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { id: true, email: true } } },
      ...pageSlice(query),
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
