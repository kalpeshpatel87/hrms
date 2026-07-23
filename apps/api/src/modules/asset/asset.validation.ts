import { AssetCategory, AssetCondition, AssetStatus } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '@atyantik/shared-types';

export const vendorSchema = z.object({
  name: z.string().trim().min(1),
  gstNumber: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
});
export const updateVendorSchema = vendorSchema.partial();
export type VendorInput = z.infer<typeof vendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;

export const assetQuerySchema = paginationQuerySchema.extend({
  category: z.nativeEnum(AssetCategory).optional(),
  status: z.nativeEnum(AssetStatus).optional(),
});
export type AssetQuery = z.infer<typeof assetQuerySchema>;

export const assetSchema = z.object({
  assetCode: z.string().trim().min(1),
  name: z.string().trim().min(1),
  category: z.nativeEnum(AssetCategory),
  brand: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  serialNumber: z.string().min(1).optional(),
  purchaseDate: z.coerce.date().optional(),
  purchaseCost: z.coerce.number().min(0).optional(),
  vendorId: z.string().min(1).optional(),
  warrantyEndsAt: z.coerce.date().optional(),
  condition: z.nativeEnum(AssetCondition).default('NEW'),
  notes: z.string().min(1).optional(),
});
export const updateAssetSchema = assetSchema.partial();
export type AssetInput = z.infer<typeof assetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;

export const assignAssetSchema = z.object({
  employeeId: z.string().min(1),
  conditionAtAssign: z.nativeEnum(AssetCondition).optional(),
  remarks: z.string().min(1).optional(),
});
export type AssignAssetInput = z.infer<typeof assignAssetSchema>;

export const returnAssetSchema = z.object({
  conditionAtReturn: z.nativeEnum(AssetCondition),
  remarks: z.string().min(1).optional(),
});
export type ReturnAssetInput = z.infer<typeof returnAssetSchema>;

export const assetMaintenanceSchema = z.object({
  type: z.string().trim().min(1),
  cost: z.coerce.number().min(0).optional(),
  vendorId: z.string().min(1).optional(),
  scheduledDate: z.coerce.date().optional(),
  completedDate: z.coerce.date().optional(),
  notes: z.string().min(1).optional(),
});
export type AssetMaintenanceInput = z.infer<typeof assetMaintenanceSchema>;
