import { prisma } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';

/**
 * This app runs a single-company deployment (see org module: Company has no
 * create endpoint) — same convention as announcement.service.ts.
 */
async function resolveDefaultCompanyId(): Promise<string> {
  const company = await prisma.company.findFirst({ select: { id: true } });
  if (!company) throw ApiError.badRequest('No company record exists yet');
  return company.id;
}

export async function getHeadcountByDepartment() {
  const companyId = await resolveDefaultCompanyId();

  const [grouped, departments] = await Promise.all([
    prisma.employee.groupBy({
      by: ['departmentId'],
      where: { companyId, status: { not: 'TERMINATED' } },
      _count: { _all: true },
    }),
    prisma.department.findMany({ where: { companyId }, select: { id: true, name: true } }),
  ]);

  const departmentNameById = new Map(departments.map((d) => [d.id, d.name]));

  return grouped
    .map((row) => ({
      departmentId: row.departmentId,
      departmentName: row.departmentId ? (departmentNameById.get(row.departmentId) ?? 'Unknown') : 'Unassigned',
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getAttendanceSummary(month: number, year: number) {
  const companyId = await resolveDefaultCompanyId();
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const grouped = await prisma.attendanceRecord.groupBy({
    by: ['status'],
    where: { employee: { companyId }, date: { gte: start, lt: end } },
    _count: { _all: true },
  });

  return grouped.map((row) => ({ status: row.status, count: row._count._all }));
}

export async function getLeaveSummary(year: number) {
  const companyId = await resolveDefaultCompanyId();
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  const [grouped, leaveTypes] = await Promise.all([
    prisma.leaveRequest.groupBy({
      by: ['leaveTypeId'],
      where: { employee: { companyId }, status: 'APPROVED', startDate: { gte: start, lt: end } },
      _sum: { totalDays: true },
      _count: { _all: true },
    }),
    prisma.leaveType.findMany({ where: { companyId }, select: { id: true, name: true } }),
  ]);

  const leaveTypeNameById = new Map(leaveTypes.map((lt) => [lt.id, lt.name]));

  return grouped
    .map((row) => ({
      leaveTypeId: row.leaveTypeId,
      leaveTypeName: leaveTypeNameById.get(row.leaveTypeId) ?? 'Unknown',
      totalDays: row._sum.totalDays ?? 0,
      requestCount: row._count._all,
    }))
    .sort((a, b) => Number(b.totalDays) - Number(a.totalDays));
}

export async function getPayrollSummary(year: number) {
  const companyId = await resolveDefaultCompanyId();

  const grouped = await prisma.payslip.groupBy({
    by: ['month'],
    where: { employee: { companyId }, year },
    _sum: { netPay: true, grossEarnings: true, totalDeductions: true },
    _count: { _all: true },
  });

  return grouped
    .map((row) => ({
      month: row.month,
      grossEarnings: row._sum.grossEarnings ?? 0,
      totalDeductions: row._sum.totalDeductions ?? 0,
      netPay: row._sum.netPay ?? 0,
      payslipCount: row._count._all,
    }))
    .sort((a, b) => a.month - b.month);
}
