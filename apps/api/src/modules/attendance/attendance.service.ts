import { differenceInMinutes, endOfMonth, startOfDay, startOfMonth } from 'date-fns';
import { ApprovalStatus, AttendanceStatus, Prisma } from '@prisma/client';
import type { PaginatedResult } from '@atyantik/shared-types';
import { prisma } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { recordAuditLog } from '../../lib/auditLog.js';
import { buildPagination } from '../../lib/response.js';
import type {
  AttendanceQuery,
  BreakInInput,
  CheckInInput,
  CheckOutInput,
  CorrectionRequestQuery,
  CreateCorrectionRequestInput,
  UpdateAttendanceInput,
} from './attendance.validation.js';

interface RequestMeta {
  ipAddress?: string;
}

/** Resolves the calling user's own Employee row. Every self-service action scopes off this. */
async function resolveEmployeeForUser(userId: string) {
  const employee = await prisma.employee.findUnique({ where: { userId }, include: { shift: true } });
  if (!employee) throw ApiError.badRequest('No employee profile is linked to this account');
  return employee;
}

function todayDateOnly(): Date {
  return startOfDay(new Date());
}

/** Parses a "HH:mm" shift time string against a given calendar date. */
function shiftTimeOn(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map((n) => Number(n));
  const result = new Date(date);
  result.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return result;
}

async function findTodayRecord(employeeId: string) {
  return prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: todayDateOnly() } },
  });
}

export async function checkIn(userId: string, input: CheckInInput, meta: RequestMeta) {
  const employee = await resolveEmployeeForUser(userId);
  const today = todayDateOnly();
  const existing = await findTodayRecord(employee.id);

  if (existing?.checkInAt && !existing.checkOutAt) {
    throw ApiError.conflict('You have already checked in today');
  }

  const now = new Date();
  let status: AttendanceStatus = AttendanceStatus.PRESENT;
  if (employee.shift) {
    const graceDeadline = shiftTimeOn(today, employee.shift.startTime);
    graceDeadline.setMinutes(graceDeadline.getMinutes() + employee.shift.gracePeriodMinutes);
    if (now > graceDeadline) {
      status = AttendanceStatus.LATE;
    }
  }

  const record = await prisma.attendanceRecord.upsert({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
    create: {
      employeeId: employee.id,
      date: today,
      checkInAt: now,
      checkInLat: input.lat,
      checkInLng: input.lng,
      checkInIp: meta.ipAddress,
      status,
    },
    update: {
      checkInAt: now,
      checkInLat: input.lat,
      checkInLng: input.lng,
      checkInIp: meta.ipAddress,
      status,
    },
  });

  await recordAuditLog({ action: 'CREATE', entityType: 'AttendanceRecord', entityId: record.id, after: record });
  return record;
}

export async function checkOut(userId: string, input: CheckOutInput, meta: RequestMeta) {
  const employee = await resolveEmployeeForUser(userId);
  const record = await findTodayRecord(employee.id);

  if (!record || !record.checkInAt || record.checkOutAt) {
    throw ApiError.badRequest('No open check-in found for today');
  }

  const now = new Date();
  const totalBreakMinutes = record.totalBreakMinutes ?? 0;
  const totalWorkMinutes = Math.max(0, differenceInMinutes(now, record.checkInAt) - totalBreakMinutes);

  const updated = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      checkOutAt: now,
      checkOutLat: input.lat,
      checkOutLng: input.lng,
      checkOutIp: meta.ipAddress,
      totalWorkMinutes,
    },
  });

  await recordAuditLog({
    action: 'UPDATE',
    entityType: 'AttendanceRecord',
    entityId: updated.id,
    before: record,
    after: updated,
  });
  return updated;
}

export async function breakIn(userId: string, input: BreakInInput) {
  const employee = await resolveEmployeeForUser(userId);
  const record = await findTodayRecord(employee.id);

  if (!record || !record.checkInAt || record.checkOutAt) {
    throw ApiError.badRequest('You must be checked in to start a break');
  }

  const openBreak = await prisma.attendanceBreak.findFirst({
    where: { attendanceRecordId: record.id, breakOutAt: null },
  });
  if (openBreak) throw ApiError.conflict('A break is already in progress');

  const breakRow = await prisma.attendanceBreak.create({
    data: { attendanceRecordId: record.id, breakInAt: new Date(), breakType: input.breakType },
  });
  return breakRow;
}

export async function breakOut(userId: string) {
  const employee = await resolveEmployeeForUser(userId);
  const record = await findTodayRecord(employee.id);
  if (!record) throw ApiError.badRequest('No attendance record found for today');

  const openBreak = await prisma.attendanceBreak.findFirst({
    where: { attendanceRecordId: record.id, breakOutAt: null },
    orderBy: { breakInAt: 'desc' },
  });
  if (!openBreak) throw ApiError.badRequest('No active break to end');

  const now = new Date();
  await prisma.attendanceBreak.update({ where: { id: openBreak.id }, data: { breakOutAt: now } });

  const closedBreaks = await prisma.attendanceBreak.findMany({
    where: { attendanceRecordId: record.id, breakOutAt: { not: null } },
  });
  const totalBreakMinutes = closedBreaks.reduce(
    (sum, b) => sum + differenceInMinutes(b.breakOutAt as Date, b.breakInAt),
    0,
  );

  const updatedRecord = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: { totalBreakMinutes },
  });

  return updatedRecord;
}

export async function getMyAttendance(userId: string, month?: number, year?: number) {
  const employee = await resolveEmployeeForUser(userId);
  const now = new Date();
  const anchor = new Date(year ?? now.getFullYear(), (month ?? now.getMonth() + 1) - 1, 1);
  const rangeStart = startOfMonth(anchor);
  const rangeEnd = endOfMonth(anchor);

  return prisma.attendanceRecord.findMany({
    where: { employeeId: employee.id, date: { gte: rangeStart, lte: rangeEnd } },
    include: { breaks: true },
    orderBy: { date: 'asc' },
  });
}

export async function listAttendance(query: AttendanceQuery): Promise<PaginatedResult<unknown>> {
  const { page, pageSize, sortBy, sortDir, search, employeeId, departmentId, status, dateFrom, dateTo } = query;

  const where: Prisma.AttendanceRecordWhereInput = {
    ...(employeeId && { employeeId }),
    ...(status && { status }),
    ...((dateFrom || dateTo) && {
      date: {
        ...(dateFrom && { gte: dateFrom }),
        ...(dateTo && { lte: dateTo }),
      },
    }),
    ...((departmentId || search) && {
      employee: {
        ...(departmentId && { departmentId }),
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { employeeCode: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
    }),
  };

  const sortableFields = new Set(['date', 'checkInAt', 'checkOutAt', 'status', 'createdAt']);
  const orderBy: Prisma.AttendanceRecordOrderByWithRelationInput = sortableFields.has(sortBy ?? '')
    ? { [sortBy as string]: sortDir }
    : { date: sortDir };

  const [items, total] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            departmentId: true,
          },
        },
      },
    }),
    prisma.attendanceRecord.count({ where }),
  ]);

  return { items, ...buildPagination(total, page, pageSize) };
}

export async function updateAttendance(id: string, input: UpdateAttendanceInput) {
  const record = await prisma.attendanceRecord.findUnique({ where: { id } });
  if (!record) throw ApiError.notFound('Attendance record not found');

  const checkInAt = input.checkInAt ?? record.checkInAt;
  const checkOutAt = input.checkOutAt ?? record.checkOutAt;
  let totalWorkMinutes = record.totalWorkMinutes;
  if (checkInAt && checkOutAt) {
    totalWorkMinutes = Math.max(0, differenceInMinutes(checkOutAt, checkInAt) - (record.totalBreakMinutes ?? 0));
  }

  const updated = await prisma.attendanceRecord.update({
    where: { id },
    data: {
      ...input,
      totalWorkMinutes,
    },
  });

  await recordAuditLog({
    action: 'UPDATE',
    entityType: 'AttendanceRecord',
    entityId: id,
    before: record,
    after: updated,
  });
  return updated;
}

export async function createCorrectionRequest(userId: string, input: CreateCorrectionRequestInput) {
  const employee = await resolveEmployeeForUser(userId);
  const record = await prisma.attendanceRecord.findUnique({ where: { id: input.attendanceRecordId } });
  if (!record) throw ApiError.notFound('Attendance record not found');
  if (record.employeeId !== employee.id) {
    throw ApiError.forbidden('You can only request corrections for your own attendance');
  }

  const correctionRequest = await prisma.attendanceCorrectionRequest.create({
    data: {
      attendanceRecordId: record.id,
      employeeId: employee.id,
      requestedCheckInAt: input.requestedCheckInAt,
      requestedCheckOutAt: input.requestedCheckOutAt,
      reason: input.reason,
      status: ApprovalStatus.PENDING,
    },
  });

  await recordAuditLog({
    action: 'CREATE',
    entityType: 'AttendanceCorrectionRequest',
    entityId: correctionRequest.id,
    after: correctionRequest,
  });
  return correctionRequest;
}

export async function listCorrectionRequests(query: CorrectionRequestQuery): Promise<PaginatedResult<unknown>> {
  const { page, pageSize, sortDir, status, employeeId } = query;

  const where: Prisma.AttendanceCorrectionRequestWhereInput = {
    ...(status && { status }),
    ...(employeeId && { employeeId }),
  };

  const [items, total] = await Promise.all([
    prisma.attendanceCorrectionRequest.findMany({
      where,
      orderBy: { createdAt: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
        attendanceRecord: true,
      },
    }),
    prisma.attendanceCorrectionRequest.count({ where }),
  ]);

  return { items, ...buildPagination(total, page, pageSize) };
}

export async function approveCorrectionRequest(id: string, actorUserId: string) {
  const request = await prisma.attendanceCorrectionRequest.findUnique({
    where: { id },
    include: { attendanceRecord: true },
  });
  if (!request) throw ApiError.notFound('Correction request not found');
  if (request.status !== ApprovalStatus.PENDING) {
    throw ApiError.badRequest('This correction request has already been processed');
  }

  const record = request.attendanceRecord;
  const checkInAt = request.requestedCheckInAt ?? record.checkInAt;
  const checkOutAt = request.requestedCheckOutAt ?? record.checkOutAt;
  let totalWorkMinutes = record.totalWorkMinutes;
  if (checkInAt && checkOutAt) {
    totalWorkMinutes = Math.max(0, differenceInMinutes(checkOutAt, checkInAt) - (record.totalBreakMinutes ?? 0));
  }

  const updatedRecord = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      checkInAt,
      checkOutAt,
      totalWorkMinutes,
      isRegularized: true,
    },
  });

  const updatedRequest = await prisma.attendanceCorrectionRequest.update({
    where: { id },
    data: { status: ApprovalStatus.APPROVED, approvedById: actorUserId, approvedAt: new Date() },
  });

  await recordAuditLog({
    action: 'APPROVE',
    entityType: 'AttendanceRecord',
    entityId: record.id,
    before: record,
    after: updatedRecord,
    metadata: { correctionRequestId: id },
  });

  return { correctionRequest: updatedRequest, attendanceRecord: updatedRecord };
}

export async function rejectCorrectionRequest(id: string, actorUserId: string) {
  const request = await prisma.attendanceCorrectionRequest.findUnique({ where: { id } });
  if (!request) throw ApiError.notFound('Correction request not found');
  if (request.status !== ApprovalStatus.PENDING) {
    throw ApiError.badRequest('This correction request has already been processed');
  }

  const updated = await prisma.attendanceCorrectionRequest.update({
    where: { id },
    data: { status: ApprovalStatus.REJECTED, approvedById: actorUserId, approvedAt: new Date() },
  });

  await recordAuditLog({
    action: 'REJECT',
    entityType: 'AttendanceCorrectionRequest',
    entityId: id,
    before: request,
    after: updated,
  });
  return updated;
}
