import type { Prisma } from '@prisma/client';
import { prisma, softDelete } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { recordAuditLog } from '../../lib/auditLog.js';
import { buildPagination } from '../../lib/response.js';
import type {
  AssetInput,
  AssetMaintenanceInput,
  AssetQuery,
  AssignAssetInput,
  ReturnAssetInput,
  UpdateAssetInput,
  UpdateVendorInput,
  VendorInput,
} from './asset.validation.js';

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
// Vendor
// ---------------------------------------------------------------------------

export async function listVendors(query: { page: number; pageSize: number; search?: string }) {
  const where: Prisma.VendorWhereInput = query.search
    ? { name: { contains: query.search, mode: 'insensitive' } }
    : {};
  const [items, total] = await Promise.all([
    prisma.vendor.findMany({ where, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
    prisma.vendor.count({ where }),
  ]);
  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function createVendor(input: VendorInput) {
  const companyId = await resolveCompanyId();
  const vendor = await prisma.vendor.create({ data: { ...input, companyId } });
  await recordAuditLog({ action: 'CREATE', entityType: 'Vendor', entityId: vendor.id, after: vendor });
  return vendor;
}

export async function updateVendor(id: string, input: UpdateVendorInput) {
  const before = await prisma.vendor.findUnique({ where: { id } });
  if (!before) throw ApiError.notFound('Vendor not found');
  const updated = await prisma.vendor.update({ where: { id }, data: input });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Vendor', entityId: id, before, after: updated });
  return updated;
}

export async function deleteVendor(id: string) {
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) throw ApiError.notFound('Vendor not found');
  await softDelete('Vendor', id);
  await recordAuditLog({ action: 'DELETE', entityType: 'Vendor', entityId: id, before: vendor });
}

// ---------------------------------------------------------------------------
// Asset
// ---------------------------------------------------------------------------

const assetInclude = {
  vendor: true,
  // Only the current (unreturned) assignment, if any — lets the admin UI show
  // who an asset is with and whether to offer "Assign" vs "Return".
  assignments: {
    where: { returnedAt: null },
    take: 1,
    orderBy: { assignedAt: 'desc' },
    include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } } },
  },
} satisfies Prisma.AssetInclude;

export async function listAssets(query: AssetQuery) {
  const where: Prisma.AssetWhereInput = {};
  if (query.category) where.category = query.category;
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { assetCode: { contains: query.search, mode: 'insensitive' } },
      { serialNumber: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: assetInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.asset.count({ where }),
  ]);
  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function createAsset(input: AssetInput) {
  const existing = await prisma.asset.findUnique({ where: { assetCode: input.assetCode } });
  if (existing) throw ApiError.conflict('An asset with this code already exists');
  const asset = await prisma.asset.create({ data: input, include: assetInclude });
  await recordAuditLog({ action: 'CREATE', entityType: 'Asset', entityId: asset.id, after: asset });
  return asset;
}

export async function updateAsset(id: string, input: UpdateAssetInput) {
  const before = await prisma.asset.findUnique({ where: { id } });
  if (!before) throw ApiError.notFound('Asset not found');
  const updated = await prisma.asset.update({ where: { id }, data: input, include: assetInclude });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Asset', entityId: id, before, after: updated });
  return updated;
}

export async function deleteAsset(id: string) {
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) throw ApiError.notFound('Asset not found');
  await softDelete('Asset', id);
  await recordAuditLog({ action: 'DELETE', entityType: 'Asset', entityId: id, before: asset });
}

// ---------------------------------------------------------------------------
// AssetAssignment
// ---------------------------------------------------------------------------

export async function assignAsset(assetId: string, input: AssignAssetInput) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw ApiError.notFound('Asset not found');
  if (asset.status !== 'AVAILABLE') throw ApiError.conflict('This asset is not currently available');

  const [assignment] = await prisma.$transaction([
    prisma.assetAssignment.create({
      data: {
        assetId,
        employeeId: input.employeeId,
        conditionAtAssign: input.conditionAtAssign ?? asset.condition,
        remarks: input.remarks,
      },
    }),
    prisma.asset.update({ where: { id: assetId }, data: { status: 'ASSIGNED' } }),
  ]);

  await recordAuditLog({ action: 'CREATE', entityType: 'AssetAssignment', entityId: assignment.id, after: assignment });
  return assignment;
}

export async function returnAsset(assignmentId: string, input: ReturnAssetInput) {
  const assignment = await prisma.assetAssignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw ApiError.notFound('Asset assignment not found');
  if (assignment.returnedAt) throw ApiError.conflict('This asset has already been returned');

  const nextStatus = input.conditionAtReturn === 'DAMAGED' ? 'IN_REPAIR' : 'AVAILABLE';

  const [updated] = await prisma.$transaction([
    prisma.assetAssignment.update({
      where: { id: assignmentId },
      data: { returnedAt: new Date(), conditionAtReturn: input.conditionAtReturn, remarks: input.remarks },
    }),
    prisma.asset.update({ where: { id: assignment.assetId }, data: { status: nextStatus, condition: input.conditionAtReturn } }),
  ]);

  await recordAuditLog({ action: 'UPDATE', entityType: 'AssetAssignment', entityId: assignmentId, after: updated });
  return updated;
}

export async function listMyAssets(userId: string) {
  const employee = await resolveEmployeeForUser(userId);
  return prisma.assetAssignment.findMany({
    where: { employeeId: employee.id, returnedAt: null },
    include: { asset: true },
    orderBy: { assignedAt: 'desc' },
  });
}

// ---------------------------------------------------------------------------
// AssetMaintenance
// ---------------------------------------------------------------------------

export async function createMaintenance(assetId: string, input: AssetMaintenanceInput) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw ApiError.notFound('Asset not found');

  const maintenance = await prisma.assetMaintenance.create({ data: { ...input, assetId } });
  await recordAuditLog({ action: 'CREATE', entityType: 'AssetMaintenance', entityId: maintenance.id, after: maintenance });
  return maintenance;
}

export async function listMaintenance(assetId: string) {
  return prisma.assetMaintenance.findMany({ where: { assetId }, orderBy: { createdAt: 'desc' } });
}
