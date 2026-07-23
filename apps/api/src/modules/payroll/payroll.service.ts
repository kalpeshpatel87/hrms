import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ApprovalStatus,
  ComponentCalculationType,
  type Prisma,
  PayrollRunStatus,
  SalaryComponentType,
} from '@prisma/client';
import { subDays } from 'date-fns';
import PDFDocument from 'pdfkit';
import type { PaginatedResult, PaginationQuery } from '@atyantik/shared-types';
import { env } from '../../config/env.js';
import { prisma, type PrismaTransaction } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { recordAuditLog } from '../../lib/auditLog.js';
import { buildPagination } from '../../lib/response.js';
import { getStorageProvider } from '../../lib/storage/index.js';
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

// -----------------------------------------------------------------------
// Shared helpers
// -----------------------------------------------------------------------

/** Resolves the caller's Employee row (self-service scoping). */
async function getEmployeeForUser(userId: string) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw ApiError.notFound('No employee profile is linked to this account');
  return employee;
}

/**
 * Resolves the company an admin action should operate on. This is a
 * single-tenant-first deployment (see prisma/seed.ts — one Company row),
 * so an admin/payroll user without their own Employee row (e.g. a pure
 * super-admin account) falls back to the first company on record.
 */
async function resolveCompanyId(userId: string): Promise<string> {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (employee) return employee.companyId;

  const company = await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!company) throw ApiError.notFound('No company is configured yet');
  return company.id;
}

function resolveOrderBy<T extends string>(
  sortBy: string | undefined,
  allowed: readonly T[],
  fallback: T,
  sortDir: 'asc' | 'desc',
): Record<string, 'asc' | 'desc'> {
  const field = (allowed as readonly string[]).includes(sortBy ?? '') ? (sortBy as T) : fallback;
  return { [field]: sortDir };
}

// -----------------------------------------------------------------------
// Salary components catalog
// -----------------------------------------------------------------------

export async function listSalaryComponents(userId: string, query: PaginationQuery) {
  const companyId = await resolveCompanyId(userId);

  const where: Prisma.SalaryComponentWhereInput = { companyId };
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { code: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const orderBy = resolveOrderBy(query.sortBy, ['name', 'code', 'type', 'createdAt'], 'name', query.sortDir);

  const [items, total] = await Promise.all([
    prisma.salaryComponent.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.salaryComponent.count({ where }),
  ]);

  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

// -----------------------------------------------------------------------
// Salary structures
// -----------------------------------------------------------------------

export async function getActiveSalaryStructure(employeeId: string) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw ApiError.notFound('Employee not found');

  const structure = await prisma.salaryStructure.findFirst({
    where: { employeeId, isActive: true },
    include: {
      components: { include: { salaryComponent: true }, orderBy: { createdAt: 'asc' } },
    },
    orderBy: { effectiveFrom: 'desc' },
  });
  if (!structure) throw ApiError.notFound('No active salary structure found for this employee');

  return structure;
}

export async function createSalaryStructure(input: CreateSalaryStructureInput) {
  const employee = await prisma.employee.findUnique({ where: { id: input.employeeId } });
  if (!employee) throw ApiError.notFound('Employee not found');

  const componentIds = input.components.map((c) => c.salaryComponentId);
  const components = await prisma.salaryComponent.findMany({
    where: { id: { in: componentIds }, companyId: employee.companyId },
  });
  if (components.length !== new Set(componentIds).size) {
    throw ApiError.badRequest('One or more salary components are invalid for this employee\'s company');
  }

  const result = await prisma.$transaction(async (tx) => {
    const priorActive = await tx.salaryStructure.findFirst({
      where: { employeeId: input.employeeId, isActive: true },
    });

    if (priorActive) {
      await tx.salaryStructure.update({
        where: { id: priorActive.id },
        data: { isActive: false, effectiveTo: subDays(input.effectiveFrom, 1) },
      });
    }

    const structure = await tx.salaryStructure.create({
      data: {
        employeeId: input.employeeId,
        effectiveFrom: input.effectiveFrom,
        ctcAnnual: input.ctcAnnual,
        currency: input.currency,
        isActive: true,
      },
    });

    await tx.salaryStructureComponent.createMany({
      data: input.components.map((c) => ({
        salaryStructureId: structure.id,
        salaryComponentId: c.salaryComponentId,
        amount: c.amount,
        percentage: c.percentage,
        formula: c.formula,
      })),
    });

    const previousCtc = priorActive ? Number(priorActive.ctcAnnual) : null;
    if (priorActive && previousCtc !== null && previousCtc !== input.ctcAnnual) {
      await tx.salaryRevision.create({
        data: {
          salaryStructureId: structure.id,
          employeeId: input.employeeId,
          previousCtc: priorActive.ctcAnnual,
          newCtc: input.ctcAnnual,
          reason: input.reason ?? 'Salary structure revision',
          effectiveDate: input.effectiveFrom,
        },
      });
    }

    return tx.salaryStructure.findUniqueOrThrow({
      where: { id: structure.id },
      include: { components: { include: { salaryComponent: true } } },
    });
  });

  await recordAuditLog({
    action: 'CREATE',
    entityType: 'SalaryStructure',
    entityId: result.id,
    after: result,
  });

  return result;
}

// -----------------------------------------------------------------------
// Payroll runs
// -----------------------------------------------------------------------

interface ComponentBreakdownLine {
  salaryComponentId: string;
  code: string;
  name: string;
  type: SalaryComponentType;
  calculationType: ComponentCalculationType;
  amount: number;
}

/**
 * Resolves a single SalaryStructureComponent's monetary amount for a payroll
 * period, per the calculation rules:
 *  - FIXED: the stored `amount` as-is.
 *  - PERCENTAGE_OF_BASIC: `percentage`% of the structure's BASIC component amount.
 *  - PERCENTAGE_OF_CTC: `percentage`% of ctcAnnual / 12.
 *  - FORMULA: out of scope for this pass (no formula parser) — falls back to
 *    the stored flat `amount`, same as FIXED.
 */
export function resolveComponentAmount(
  calculationType: ComponentCalculationType,
  amount: Prisma.Decimal,
  percentage: Prisma.Decimal | null,
  ctcMonthly: number,
  basicAmount: number,
): number {
  const pct = percentage ? Number(percentage) : 0;
  switch (calculationType) {
    case ComponentCalculationType.PERCENTAGE_OF_BASIC:
      return (pct / 100) * basicAmount;
    case ComponentCalculationType.PERCENTAGE_OF_CTC:
      return (pct / 100) * ctcMonthly;
    case ComponentCalculationType.FIXED:
    case ComponentCalculationType.FORMULA:
    default:
      // FORMULA: intentionally not evaluating a formula expression here —
      // building a formula parser/evaluator is out of scope for this pass.
      // We just use the stored flat `amount` as a reasonable fallback.
      return Number(amount);
  }
}

async function computePayslipForEmployee(
  tx: PrismaTransaction,
  employee: { id: string },
  month: number,
  year: number,
  periodStart: Date,
  periodEnd: Date,
  daysInMonth: number,
): Promise<{
  employeeId: string;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  paidDays: number;
  lopDays: number;
  currency: string;
  breakdown: ComponentBreakdownLine[];
} | null> {
  const structure = await tx.salaryStructure.findFirst({
    where: { employeeId: employee.id, isActive: true },
    include: { components: { include: { salaryComponent: true } } },
  });
  if (!structure) return null;

  const ctcAnnual = Number(structure.ctcAnnual);
  const ctcMonthly = ctcAnnual / 12;

  const basicRow = structure.components.find((c) => c.salaryComponent.code.toUpperCase() === 'BASIC');
  // BASIC itself can only be FIXED/PERCENTAGE_OF_CTC/FORMULA (it can't sensibly
  // reference itself via PERCENTAGE_OF_BASIC) — resolve it first so every
  // other PERCENTAGE_OF_BASIC component has something to reference.
  const basicAmount = basicRow
    ? resolveComponentAmount(basicRow.salaryComponent.calculationType, basicRow.amount, basicRow.percentage, ctcMonthly, 0)
    : 0;

  const breakdown: ComponentBreakdownLine[] = structure.components.map((c) => ({
    salaryComponentId: c.salaryComponentId,
    code: c.salaryComponent.code,
    name: c.salaryComponent.name,
    type: c.salaryComponent.type,
    calculationType: c.salaryComponent.calculationType,
    amount: resolveComponentAmount(c.salaryComponent.calculationType, c.amount, c.percentage, ctcMonthly, basicAmount),
  }));

  const grossEarnings = breakdown
    .filter((c) => c.type === SalaryComponentType.EARNING)
    .reduce((sum, c) => sum + c.amount, 0);
  const totalDeductions = breakdown
    .filter((c) => c.type === SalaryComponentType.DEDUCTION)
    .reduce((sum, c) => sum + c.amount, 0);
  const netPay = grossEarnings - totalDeductions;

  // paidDays/lopDays approximation: days in the month minus (a) approved
  // LOP-type leave days and (b) unregularized absences recorded directly on
  // attendance. Deliberately simple — no overlap de-duplication between the
  // two sources, per the module spec ("keep this simple").
  const lopLeaveRequests = await tx.leaveRequest.findMany({
    where: {
      employeeId: employee.id,
      status: 'APPROVED',
      leaveType: { code: 'LOP' },
      startDate: { lte: periodEnd },
      endDate: { gte: periodStart },
    },
  });
  const lopLeaveDays = lopLeaveRequests.reduce((sum, lr) => sum + Number(lr.totalDays), 0);

  const absentDays = await tx.attendanceRecord.count({
    where: { employeeId: employee.id, status: 'ABSENT', date: { gte: periodStart, lte: periodEnd } },
  });

  const lopDays = lopLeaveDays + absentDays;
  const paidDays = Math.max(0, daysInMonth - lopDays);

  return {
    employeeId: employee.id,
    grossEarnings,
    totalDeductions,
    netPay,
    paidDays,
    lopDays,
    currency: structure.currency,
    breakdown,
  };
}

export async function createPayrollRun(userId: string, input: CreatePayrollRunInput) {
  const companyId = await resolveCompanyId(userId);

  const existingRun = await prisma.payrollRun.findUnique({
    where: { companyId_month_year: { companyId, month: input.month, year: input.year } },
  });
  if (existingRun) {
    throw ApiError.conflict(`A payroll run for ${input.month}/${input.year} already exists`);
  }

  const daysInMonth = new Date(Date.UTC(input.year, input.month, 0)).getUTCDate();
  const periodStart = new Date(Date.UTC(input.year, input.month - 1, 1));
  const periodEnd = new Date(Date.UTC(input.year, input.month - 1, daysInMonth));

  const run = await prisma.$transaction(
    async (tx) => {
      const employees = await tx.employee.findMany({
        where: { companyId, status: 'ACTIVE' },
        select: { id: true },
      });

      const payrollRun = await tx.payrollRun.create({
        data: {
          companyId,
          month: input.month,
          year: input.year,
          status: PayrollRunStatus.DRAFT,
        },
      });

      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;
      let employeeCount = 0;

      for (const employee of employees) {
        const computed = await computePayslipForEmployee(
          tx,
          employee,
          input.month,
          input.year,
          periodStart,
          periodEnd,
          daysInMonth,
        );
        if (!computed) continue; // no active salary structure — skip, per spec

        await tx.payslip.create({
          data: {
            employeeId: computed.employeeId,
            payrollRunId: payrollRun.id,
            month: input.month,
            year: input.year,
            grossEarnings: computed.grossEarnings,
            totalDeductions: computed.totalDeductions,
            netPay: computed.netPay,
            paidDays: computed.paidDays,
            lopDays: computed.lopDays,
            currency: computed.currency,
            breakdown: computed.breakdown as unknown as Prisma.InputJsonValue,
          },
        });

        totalGross += computed.grossEarnings;
        totalDeductions += computed.totalDeductions;
        totalNet += computed.netPay;
        employeeCount += 1;
      }

      return tx.payrollRun.update({
        where: { id: payrollRun.id },
        data: {
          totalGross,
          totalDeductions,
          totalNet,
          employeeCount,
          processedAt: new Date(),
        },
      });
    },
    { timeout: 60_000 },
  );

  await recordAuditLog({
    action: 'CREATE',
    entityType: 'PayrollRun',
    entityId: run.id,
    after: run,
  });

  return run;
}

export async function approvePayrollRun(userId: string, runId: string) {
  const run = await prisma.payrollRun.findUnique({ where: { id: runId } });
  if (!run) throw ApiError.notFound('Payroll run not found');
  if (run.status === PayrollRunStatus.APPROVED) {
    throw ApiError.conflict('This payroll run has already been approved');
  }

  const updated = await prisma.payrollRun.update({
    where: { id: runId },
    data: { status: PayrollRunStatus.APPROVED, approvedAt: new Date(), approvedById: userId },
  });

  await recordAuditLog({
    action: 'APPROVE',
    entityType: 'PayrollRun',
    entityId: runId,
    before: { status: run.status },
    after: { status: updated.status },
  });

  return updated;
}

export async function listPayrollRuns(
  userId: string,
  query: PayrollRunQuery,
): Promise<PaginatedResult<Prisma.PayrollRunGetPayload<Record<string, never>>>> {
  const companyId = await resolveCompanyId(userId);

  const where: Prisma.PayrollRunWhereInput = { companyId };
  if (query.status) where.status = query.status;
  if (query.year) where.year = query.year;
  if (query.month) where.month = query.month;

  const orderBy = resolveOrderBy(query.sortBy, ['year', 'month', 'createdAt', 'status'], 'year', query.sortDir);

  const [items, total] = await Promise.all([
    prisma.payrollRun.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.payrollRun.count({ where }),
  ]);

  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

// -----------------------------------------------------------------------
// Payslips
// -----------------------------------------------------------------------

export async function listMyPayslips(userId: string, query: PaginationQuery) {
  const employee = await getEmployeeForUser(userId);

  const where: Prisma.PayslipWhereInput = { employeeId: employee.id };
  const orderBy = resolveOrderBy(query.sortBy, ['year', 'month', 'createdAt'], 'year', query.sortDir);

  const [items, total] = await Promise.all([
    prisma.payslip.findMany({
      where,
      orderBy: [orderBy, { month: query.sortDir }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.payslip.count({ where }),
  ]);

  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

async function tryReadStoredPdf(pdfUrl: string): Promise<Buffer | null> {
  // The StorageProvider abstraction only exposes save/delete/getUrl (no
  // read-back), so for the local driver we resolve the file straight off
  // disk using the same convention LocalStorageProvider uses
  // (`/uploads/<key>` -> `<UPLOAD_DIR>/<key>`). If that fails (different
  // driver, file missing, etc.) the caller regenerates instead.
  const prefix = '/uploads/';
  if (!pdfUrl.startsWith(prefix)) return null;
  try {
    const key = pdfUrl.slice(prefix.length);
    const fullPath = path.join(path.resolve(env.UPLOAD_DIR), key);
    return await readFile(fullPath);
  } catch {
    return null;
  }
}

function buildPayslipPdf(payslip: {
  month: number;
  year: number;
  paidDays: Prisma.Decimal;
  lopDays: Prisma.Decimal;
  grossEarnings: Prisma.Decimal;
  totalDeductions: Prisma.Decimal;
  netPay: Prisma.Decimal;
  currency: string;
  breakdown: unknown;
  employee: {
    firstName: string;
    lastName: string;
    employeeCode: string;
    company: { name: string } | null;
  };
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const breakdown = Array.isArray(payslip.breakdown)
      ? (payslip.breakdown as ComponentBreakdownLine[])
      : [];

    doc.fontSize(18).text(payslip.employee.company?.name ?? 'Company', { align: 'center' });
    doc.fontSize(11).text('Payslip', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(11).text(`Employee: ${payslip.employee.firstName} ${payslip.employee.lastName} (${payslip.employee.employeeCode})`);
    doc.text(`Period: ${payslip.month}/${payslip.year}`);
    doc.text(`Paid Days: ${payslip.paidDays.toString()}    LOP Days: ${payslip.lopDays.toString()}`);
    doc.moveDown();

    doc.fontSize(12).text('Earnings & Deductions', { underline: true });
    doc.moveDown(0.5);
    for (const line of breakdown) {
      doc.fontSize(10).text(`${line.name} (${line.type}): ${line.amount.toFixed(2)}`);
    }
    doc.moveDown();

    doc.fontSize(11).text(`Gross Earnings: ${Number(payslip.grossEarnings).toFixed(2)} ${payslip.currency}`);
    doc.text(`Total Deductions: ${Number(payslip.totalDeductions).toFixed(2)} ${payslip.currency}`);
    doc.text(`Net Pay: ${Number(payslip.netPay).toFixed(2)} ${payslip.currency}`);

    doc.end();
  });
}

export async function getPayslipPdf(
  payslipId: string,
  requester: { sub: string; permissions: string[] },
): Promise<{ buffer: Buffer; fileName: string }> {
  const payslip = await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: { employee: { include: { company: true } } },
  });
  if (!payslip) throw ApiError.notFound('Payslip not found');

  const canReadAny = requester.permissions.includes('payroll:read');
  if (!canReadAny) {
    const employee = await getEmployeeForUser(requester.sub);
    if (employee.id !== payslip.employeeId) {
      throw ApiError.forbidden('You can only download your own payslips');
    }
  }

  let buffer: Buffer | null = payslip.pdfUrl ? await tryReadStoredPdf(payslip.pdfUrl) : null;

  if (!buffer) {
    buffer = await buildPayslipPdf(payslip);
    const stored = await getStorageProvider().save({
      buffer,
      originalName: `payslip-${payslip.employee.employeeCode}-${payslip.month}-${payslip.year}.pdf`,
      mimeType: 'application/pdf',
      folder: `payslips/${payslip.employeeId}`,
    });
    await prisma.payslip.update({ where: { id: payslip.id }, data: { pdfUrl: stored.url } });
  }

  await recordAuditLog({ action: 'DOWNLOAD', entityType: 'Payslip', entityId: payslip.id });

  return {
    buffer,
    fileName: `payslip-${payslip.month}-${payslip.year}.pdf`,
  };
}

// -----------------------------------------------------------------------
// Reimbursements
// -----------------------------------------------------------------------

export async function listReimbursements(query: ReimbursementQuery) {
  const where: Prisma.ReimbursementWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.employeeId) where.employeeId = query.employeeId;

  const orderBy = resolveOrderBy(query.sortBy, ['createdAt', 'amount', 'status'], 'createdAt', query.sortDir);

  const [items, total] = await Promise.all([
    prisma.reimbursement.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.reimbursement.count({ where }),
  ]);

  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function createReimbursement(input: CreateReimbursementInput) {
  const employee = await prisma.employee.findUnique({ where: { id: input.employeeId } });
  if (!employee) throw ApiError.notFound('Employee not found');

  const reimbursement = await prisma.reimbursement.create({
    data: {
      employeeId: input.employeeId,
      category: input.category,
      amount: input.amount,
      description: input.description,
      receiptUrl: input.receiptUrl,
      status: ApprovalStatus.PENDING,
    },
  });

  await recordAuditLog({ action: 'CREATE', entityType: 'Reimbursement', entityId: reimbursement.id, after: reimbursement });

  return reimbursement;
}

export async function decideReimbursement(userId: string, reimbursementId: string, input: ReimbursementDecisionInput) {
  const reimbursement = await prisma.reimbursement.findUnique({ where: { id: reimbursementId } });
  if (!reimbursement) throw ApiError.notFound('Reimbursement not found');
  if (reimbursement.status !== ApprovalStatus.PENDING) {
    throw ApiError.conflict('This reimbursement has already been decided');
  }

  const updated = await prisma.reimbursement.update({
    where: { id: reimbursementId },
    data: { status: input.status, approvedById: userId, approvedAt: new Date() },
  });

  await recordAuditLog({
    action: input.status === ApprovalStatus.APPROVED ? 'APPROVE' : 'REJECT',
    entityType: 'Reimbursement',
    entityId: reimbursementId,
    before: { status: reimbursement.status },
    after: { status: updated.status },
  });

  return updated;
}

// -----------------------------------------------------------------------
// Deductions
// -----------------------------------------------------------------------

export async function listDeductions(query: DeductionQuery) {
  const where: Prisma.DeductionWhereInput = {};
  if (query.employeeId) where.employeeId = query.employeeId;

  const orderBy = resolveOrderBy(query.sortBy, ['createdAt', 'amount'], 'createdAt', query.sortDir);

  const [items, total] = await Promise.all([
    prisma.deduction.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.deduction.count({ where }),
  ]);

  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function createDeduction(input: CreateDeductionInput) {
  const employee = await prisma.employee.findUnique({ where: { id: input.employeeId } });
  if (!employee) throw ApiError.notFound('Employee not found');

  const deduction = await prisma.deduction.create({
    data: {
      employeeId: input.employeeId,
      payrollRunId: input.payrollRunId,
      type: input.type,
      amount: input.amount,
      reason: input.reason,
    },
  });

  await recordAuditLog({ action: 'CREATE', entityType: 'Deduction', entityId: deduction.id, after: deduction });

  return deduction;
}
