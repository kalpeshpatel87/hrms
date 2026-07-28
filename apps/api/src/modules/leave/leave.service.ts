import { differenceInCalendarDays } from 'date-fns';
import { ApprovalStatus, LeaveStatus, LeaveUnit, Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { recordAuditLog } from '../../lib/auditLog.js';
import type {
  ApprovalActionInput,
  CancelLeaveRequestInput,
  CreateLeavePolicyInput,
  CreateLeaveRequestAdminInput,
  CreateLeaveRequestInput,
  CreateLeaveTypeInput,
  LeaveApprovalQuery,
  LeavePolicyQuery,
  LeaveRequestAdminQuery,
  LeaveRequestMeQuery,
  LeaveTypeQuery,
  UpdateLeavePolicyInput,
  UpdateLeaveTypeInput,
} from './leave.validation.js';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Resolves the calling user's own Employee row — never trust a client-supplied employeeId for self-service actions. */
async function getSelfEmployee(userId: string) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) {
    throw ApiError.badRequest('No employee profile is linked to this account');
  }
  return employee;
}

/** Best-effort companyId for scoping admin catalog/list reads; undefined if the caller has no Employee profile. */
async function resolveCompanyId(userId: string): Promise<string | undefined> {
  const employee = await prisma.employee.findUnique({ where: { userId }, select: { companyId: true } });
  return employee?.companyId;
}

async function findSuperAdminUserId(): Promise<string> {
  const superAdminUserRole = await prisma.userRole.findFirst({
    where: { role: { slug: 'super_admin' } },
    orderBy: { assignedAt: 'asc' },
    select: { userId: true },
  });
  if (!superAdminUserRole) {
    throw ApiError.badRequest('No approver is available — no reporting manager set and no Super Admin configured');
  }
  return superAdminUserRole.userId;
}

/**
 * Full day = 1. A half-day unit (HALF_DAY_FIRST/HALF_DAY_SECOND) on the start
 * or end boundary shaves 0.5 off. A single-day request is 0.5 if either unit
 * is a half-day unit, else 1.
 */
export function computeTotalDays(
  startDate: Date,
  endDate: Date,
  startDayUnit: LeaveUnit,
  endDayUnit: LeaveUnit,
): number {
  const calendarDays = differenceInCalendarDays(endDate, startDate) + 1;
  if (calendarDays <= 0) {
    throw ApiError.badRequest('startDate must be on or before endDate');
  }
  if (calendarDays === 1) {
    const isHalfDay = startDayUnit !== LeaveUnit.FULL_DAY || endDayUnit !== LeaveUnit.FULL_DAY;
    return isHalfDay ? 0.5 : 1;
  }
  let total = calendarDays;
  if (startDayUnit !== LeaveUnit.FULL_DAY) total -= 0.5;
  if (endDayUnit !== LeaveUnit.FULL_DAY) total -= 0.5;
  return total;
}

function paginationArgs(query: { page: number; pageSize: number }) {
  return { skip: (query.page - 1) * query.pageSize, take: query.pageSize };
}

function leaveTypeOrderBy(query: LeaveTypeQuery): Prisma.LeaveTypeOrderByWithRelationInput {
  switch (query.sortBy) {
    case 'code':
      return { code: query.sortDir };
    case 'createdAt':
      return { createdAt: query.sortDir };
    default:
      return { name: query.sortDir };
  }
}

function leavePolicyOrderBy(query: LeavePolicyQuery): Prisma.LeavePolicyOrderByWithRelationInput {
  switch (query.sortBy) {
    case 'createdAt':
      return { createdAt: query.sortDir };
    default:
      return { effectiveFrom: query.sortDir };
  }
}

function leaveRequestOrderBy(
  query: LeaveRequestMeQuery | LeaveRequestAdminQuery,
): Prisma.LeaveRequestOrderByWithRelationInput {
  switch (query.sortBy) {
    case 'startDate':
      return { startDate: query.sortDir };
    case 'createdAt':
      return { createdAt: query.sortDir };
    default:
      return { appliedAt: query.sortDir };
  }
}

// ---------------------------------------------------------------------------
// LeaveType (admin catalog management)
// ---------------------------------------------------------------------------

export async function listLeaveTypes(userId: string, query: LeaveTypeQuery) {
  const companyId = await resolveCompanyId(userId);
  const where: Prisma.LeaveTypeWhereInput = {
    ...(companyId ? { companyId } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { code: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.leaveType.findMany({
      where,
      orderBy: leaveTypeOrderBy(query),
      ...paginationArgs(query),
    }),
    prisma.leaveType.count({ where }),
  ]);
  return { items, total };
}

export async function createLeaveType(userId: string, input: CreateLeaveTypeInput) {
  const companyId = await resolveCompanyId(userId);
  if (!companyId) throw ApiError.badRequest('No company profile is linked to this account');

  const leaveType = await prisma.leaveType.create({ data: { ...input, companyId } });
  await recordAuditLog({ action: 'CREATE', entityType: 'LeaveType', entityId: leaveType.id, after: leaveType });
  return leaveType;
}

export async function updateLeaveType(id: string, input: UpdateLeaveTypeInput) {
  const existing = await prisma.leaveType.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Leave type not found');

  const updated = await prisma.leaveType.update({ where: { id }, data: input });
  await recordAuditLog({
    action: 'UPDATE',
    entityType: 'LeaveType',
    entityId: id,
    before: existing,
    after: updated,
  });
  return updated;
}

// ---------------------------------------------------------------------------
// LeavePolicy (admin catalog management)
// ---------------------------------------------------------------------------

export async function listLeavePolicies(userId: string, query: LeavePolicyQuery) {
  const companyId = await resolveCompanyId(userId);
  const where: Prisma.LeavePolicyWhereInput = {
    ...(companyId ? { companyId } : {}),
    ...(query.leaveTypeId ? { leaveTypeId: query.leaveTypeId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.leavePolicy.findMany({
      where,
      include: { leaveType: true },
      orderBy: leavePolicyOrderBy(query),
      ...paginationArgs(query),
    }),
    prisma.leavePolicy.count({ where }),
  ]);
  return { items, total };
}

export async function createLeavePolicy(userId: string, input: CreateLeavePolicyInput) {
  const companyId = await resolveCompanyId(userId);
  if (!companyId) throw ApiError.badRequest('No company profile is linked to this account');

  const leaveType = await prisma.leaveType.findFirst({ where: { id: input.leaveTypeId, companyId } });
  if (!leaveType) throw ApiError.badRequest('Leave type not found for this company');

  const policy = await prisma.leavePolicy.create({ data: { ...input, companyId } });
  await recordAuditLog({ action: 'CREATE', entityType: 'LeavePolicy', entityId: policy.id, after: policy });
  return policy;
}

export async function updateLeavePolicy(id: string, input: UpdateLeavePolicyInput) {
  const existing = await prisma.leavePolicy.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Leave policy not found');

  const updated = await prisma.leavePolicy.update({ where: { id }, data: input });
  await recordAuditLog({
    action: 'UPDATE',
    entityType: 'LeavePolicy',
    entityId: id,
    before: existing,
    after: updated,
  });
  return updated;
}

// ---------------------------------------------------------------------------
// LeaveBalance
// ---------------------------------------------------------------------------

export async function getMyLeaveBalances(userId: string, year?: number) {
  const employee = await getSelfEmployee(userId);
  const targetYear = year ?? new Date().getFullYear();

  return prisma.leaveBalance.findMany({
    where: { employeeId: employee.id, year: targetYear },
    include: { leaveType: true },
    orderBy: { leaveType: { name: 'asc' } },
  });
}

/**
 * Admin-only: for every active employee and every LeavePolicy applicable to
 * their employment type, creates a LeaveBalance row for `year` if one doesn't
 * already exist. Never overwrites an existing row (usage already tracked
 * against it) — this only backfills gaps, e.g. new hires or newly added
 * policies. There is no scheduled accrual job yet; this is the manual trigger.
 */
export async function accrueLeaveBalances(userId: string, year: number) {
  const companyId = await resolveCompanyId(userId);
  if (!companyId) throw ApiError.badRequest('No employee profile is linked to this account');

  const [employees, policies] = await Promise.all([
    prisma.employee.findMany({
      where: { companyId, status: { not: 'TERMINATED' } },
      select: { id: true, employmentType: true },
    }),
    prisma.leavePolicy.findMany({ where: { companyId, effectiveFrom: { lte: new Date(Date.UTC(year, 11, 31)) } } }),
  ]);

  let created = 0;
  for (const employee of employees) {
    const applicablePolicies = policies.filter((p) => p.applicableEmploymentTypes.includes(employee.employmentType));
    for (const policy of applicablePolicies) {
      const existing = await prisma.leaveBalance.findUnique({
        where: { employeeId_leaveTypeId_year: { employeeId: employee.id, leaveTypeId: policy.leaveTypeId, year } },
      });
      if (existing) continue;

      await prisma.leaveBalance.create({
        data: {
          employeeId: employee.id,
          leaveTypeId: policy.leaveTypeId,
          year,
          allocated: policy.annualQuota,
          available: policy.annualQuota,
        },
      });
      created += 1;
    }
  }

  await recordAuditLog({ action: 'CREATE', entityType: 'LeaveBalance', entityId: `accrual-${year}`, after: { year, created } });
  return { year, created };
}

// ---------------------------------------------------------------------------
// LeaveRequest
// ---------------------------------------------------------------------------

/** Core leave-request creation, shared by the self-service and admin-on-behalf-of paths below. */
async function createLeaveRequestForEmployee(
  employee: { id: string; companyId: string; reportingManagerId: string | null },
  input: CreateLeaveRequestInput,
) {
  const leaveType = await prisma.leaveType.findFirst({
    where: { id: input.leaveTypeId, companyId: employee.companyId },
  });
  if (!leaveType) throw ApiError.badRequest('Leave type not found');

  const totalDays = computeTotalDays(input.startDate, input.endDate, input.startDayUnit, input.endDayUnit);
  const year = input.startDate.getFullYear();

  const balance = await prisma.leaveBalance.findUnique({
    where: { employeeId_leaveTypeId_year: { employeeId: employee.id, leaveTypeId: leaveType.id, year } },
  });
  if (!balance) {
    throw ApiError.badRequest(`No leave balance record found for ${leaveType.name} in ${year}`);
  }
  if (!leaveType.allowNegativeBalance && balance.available.toNumber() < totalDays) {
    throw ApiError.badRequest('Insufficient leave balance for the requested dates');
  }

  // Resolve the approver: the employee's reporting manager's User, or the Super Admin as a fallback.
  let approverId: string;
  if (employee.reportingManagerId) {
    const manager = await prisma.employee.findUnique({
      where: { id: employee.reportingManagerId },
      select: { userId: true },
    });
    approverId = manager?.userId ?? (await findSuperAdminUserId());
  } else {
    approverId = await findSuperAdminUserId();
  }

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      employeeId: employee.id,
      leaveTypeId: leaveType.id,
      startDate: input.startDate,
      endDate: input.endDate,
      startDayUnit: input.startDayUnit,
      endDayUnit: input.endDayUnit,
      totalDays,
      reason: input.reason,
      status: LeaveStatus.PENDING,
      approvals: {
        create: [{ approverId, sequence: 1, status: ApprovalStatus.PENDING }],
      },
    },
    include: { approvals: true, leaveType: true },
  });

  await recordAuditLog({
    action: 'CREATE',
    entityType: 'LeaveRequest',
    entityId: leaveRequest.id,
    after: leaveRequest,
  });

  return leaveRequest;
}

export async function createLeaveRequest(userId: string, input: CreateLeaveRequestInput) {
  const employee = await getSelfEmployee(userId);
  return createLeaveRequestForEmployee(employee, input);
}

/** Admin-only: apply leave on behalf of any employee (e.g. backfilling a request phoned in to HR). */
export async function createLeaveRequestForAdmin(input: CreateLeaveRequestAdminInput) {
  const { employeeId, ...rest } = input;
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw ApiError.badRequest('Employee not found');
  return createLeaveRequestForEmployee(employee, rest);
}

export async function listMyLeaveRequests(userId: string, query: LeaveRequestMeQuery) {
  const employee = await getSelfEmployee(userId);
  const where: Prisma.LeaveRequestWhereInput = {
    employeeId: employee.id,
    ...(query.status ? { status: query.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      include: { leaveType: true, approvals: true },
      orderBy: leaveRequestOrderBy(query),
      ...paginationArgs(query),
    }),
    prisma.leaveRequest.count({ where }),
  ]);
  return { items, total };
}

export async function listAllLeaveRequests(userId: string, query: LeaveRequestAdminQuery) {
  const companyId = await resolveCompanyId(userId);
  const where: Prisma.LeaveRequestWhereInput = {
    ...(companyId ? { employee: { companyId } } : {}),
    ...(query.employeeId ? { employeeId: query.employeeId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.leaveTypeId ? { leaveTypeId: query.leaveTypeId } : {}),
    ...(query.dateFrom || query.dateTo
      ? {
          AND: [
            ...(query.dateFrom ? [{ endDate: { gte: query.dateFrom } }] : []),
            ...(query.dateTo ? [{ startDate: { lte: query.dateTo } }] : []),
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
        approvals: true,
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      },
      orderBy: leaveRequestOrderBy(query),
      ...paginationArgs(query),
    }),
    prisma.leaveRequest.count({ where }),
  ]);
  return { items, total };
}

export async function cancelLeaveRequest(userId: string, leaveRequestId: string, input: CancelLeaveRequestInput) {
  const employee = await getSelfEmployee(userId);

  const leaveRequest = await prisma.leaveRequest.findUnique({ where: { id: leaveRequestId } });
  if (!leaveRequest || leaveRequest.employeeId !== employee.id) {
    throw ApiError.notFound('Leave request not found');
  }
  if (leaveRequest.status !== LeaveStatus.PENDING && leaveRequest.status !== LeaveStatus.APPROVED) {
    throw ApiError.badRequest('Only pending or approved leave requests can be cancelled');
  }
  if (leaveRequest.startDate.getTime() <= Date.now()) {
    throw ApiError.badRequest('Only requests with a future start date can be cancelled');
  }

  const wasApproved = leaveRequest.status === LeaveStatus.APPROVED;

  const updated = await prisma.$transaction(async (tx) => {
    if (wasApproved) {
      const totalDays = leaveRequest.totalDays.toNumber();
      const year = leaveRequest.startDate.getFullYear();
      await tx.leaveBalance.update({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: leaveRequest.employeeId,
            leaveTypeId: leaveRequest.leaveTypeId,
            year,
          },
        },
        data: { used: { decrement: totalDays }, available: { increment: totalDays } },
      });
    }

    await tx.leaveApproval.updateMany({
      where: { leaveRequestId: leaveRequest.id, status: ApprovalStatus.PENDING },
      data: { status: ApprovalStatus.CANCELLED, decidedAt: new Date() },
    });

    return tx.leaveRequest.update({
      where: { id: leaveRequest.id },
      data: {
        status: LeaveStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: input.cancelReason,
      },
    });
  });

  await recordAuditLog({
    action: 'UPDATE',
    entityType: 'LeaveRequest',
    entityId: leaveRequest.id,
    before: leaveRequest,
    after: updated,
  });

  return updated;
}

// ---------------------------------------------------------------------------
// LeaveApproval
// ---------------------------------------------------------------------------

export async function listPendingApprovals(userId: string, query: LeaveApprovalQuery) {
  const where: Prisma.LeaveApprovalWhereInput = { approverId: userId, status: ApprovalStatus.PENDING };

  const [items, total] = await Promise.all([
    prisma.leaveApproval.findMany({
      where,
      include: {
        leaveRequest: {
          include: {
            leaveType: true,
            employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          },
        },
      },
      orderBy: { createdAt: query.sortDir },
      ...paginationArgs(query),
    }),
    prisma.leaveApproval.count({ where }),
  ]);
  return { items, total };
}

async function loadApprovalOrThrow(approvalId: string) {
  const approval = await prisma.leaveApproval.findUnique({
    where: { id: approvalId },
    include: { leaveRequest: true },
  });
  if (!approval) throw ApiError.notFound('Leave approval not found');
  if (approval.status !== ApprovalStatus.PENDING) {
    throw ApiError.conflict('This leave request has already been decided');
  }
  return approval;
}

export async function approveLeaveRequest(approvalId: string, input: ApprovalActionInput) {
  const approval = await loadApprovalOrThrow(approvalId);
  const leaveRequest = approval.leaveRequest;
  const totalDays = leaveRequest.totalDays.toNumber();
  const year = leaveRequest.startDate.getFullYear();

  const before = { approval, leaveRequest };

  const result = await prisma.$transaction(async (tx) => {
    const updatedApproval = await tx.leaveApproval.update({
      where: { id: approval.id },
      data: { status: ApprovalStatus.APPROVED, decidedAt: new Date(), comments: input.comments },
    });

    const updatedRequest = await tx.leaveRequest.update({
      where: { id: leaveRequest.id },
      data: { status: LeaveStatus.APPROVED },
    });

    const updatedBalance = await tx.leaveBalance.update({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: leaveRequest.employeeId,
          leaveTypeId: leaveRequest.leaveTypeId,
          year,
        },
      },
      data: { used: { increment: totalDays }, available: { decrement: totalDays } },
    });

    return { approval: updatedApproval, leaveRequest: updatedRequest, balance: updatedBalance };
  });

  await recordAuditLog({
    action: 'APPROVE',
    entityType: 'LeaveRequest',
    entityId: leaveRequest.id,
    before,
    after: result,
  });

  return result;
}

export async function rejectLeaveRequest(approvalId: string, input: ApprovalActionInput) {
  const approval = await loadApprovalOrThrow(approvalId);
  const leaveRequest = approval.leaveRequest;
  const before = { approval, leaveRequest };

  const result = await prisma.$transaction(async (tx) => {
    const updatedApproval = await tx.leaveApproval.update({
      where: { id: approval.id },
      data: { status: ApprovalStatus.REJECTED, decidedAt: new Date(), comments: input.comments },
    });

    const updatedRequest = await tx.leaveRequest.update({
      where: { id: leaveRequest.id },
      data: { status: LeaveStatus.REJECTED },
    });

    return { approval: updatedApproval, leaveRequest: updatedRequest };
  });

  await recordAuditLog({
    action: 'REJECT',
    entityType: 'LeaveRequest',
    entityId: leaveRequest.id,
    before,
    after: result,
  });

  return result;
}
