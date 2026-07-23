import type { Request, Response } from 'express';
import type { PaginationQuery } from '@atyantik/shared-types';
import { sendCreated, sendPaginated, sendSuccess } from '../../lib/response.js';
import * as assetService from './asset.service.js';
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

export async function listVendorsHandler(req: Request, res: Response) {
  const query = req.query as unknown as PaginationQuery;
  const result = await assetService.listVendors(query);
  return sendPaginated(res, result);
}

export async function createVendorHandler(req: Request, res: Response) {
  const body = req.body as VendorInput;
  const vendor = await assetService.createVendor(body);
  return sendCreated(res, vendor);
}

export async function updateVendorHandler(req: Request, res: Response) {
  const body = req.body as UpdateVendorInput;
  const vendor = await assetService.updateVendor(req.params.id as string, body);
  return sendSuccess(res, vendor, 'Vendor updated successfully');
}

export async function deleteVendorHandler(req: Request, res: Response) {
  await assetService.deleteVendor(req.params.id as string);
  return sendSuccess(res, null, 'Vendor deleted successfully');
}

export async function listAssetsHandler(req: Request, res: Response) {
  const query = req.query as unknown as AssetQuery;
  const result = await assetService.listAssets(query);
  return sendPaginated(res, result);
}

export async function createAssetHandler(req: Request, res: Response) {
  const body = req.body as AssetInput;
  const asset = await assetService.createAsset(body);
  return sendCreated(res, asset);
}

export async function updateAssetHandler(req: Request, res: Response) {
  const body = req.body as UpdateAssetInput;
  const asset = await assetService.updateAsset(req.params.id as string, body);
  return sendSuccess(res, asset, 'Asset updated successfully');
}

export async function deleteAssetHandler(req: Request, res: Response) {
  await assetService.deleteAsset(req.params.id as string);
  return sendSuccess(res, null, 'Asset deleted successfully');
}

export async function assignAssetHandler(req: Request, res: Response) {
  const body = req.body as AssignAssetInput;
  const assignment = await assetService.assignAsset(req.params.id as string, body);
  return sendCreated(res, assignment, 'Asset assigned successfully');
}

export async function returnAssetHandler(req: Request, res: Response) {
  const body = req.body as ReturnAssetInput;
  const assignment = await assetService.returnAsset(req.params.id as string, body);
  return sendSuccess(res, assignment, 'Asset returned successfully');
}

export async function listMyAssetsHandler(req: Request, res: Response) {
  const assignments = await assetService.listMyAssets(req.user!.sub);
  return sendSuccess(res, assignments);
}

export async function createMaintenanceHandler(req: Request, res: Response) {
  const body = req.body as AssetMaintenanceInput;
  const maintenance = await assetService.createMaintenance(req.params.id as string, body);
  return sendCreated(res, maintenance);
}

export async function listMaintenanceHandler(req: Request, res: Response) {
  const maintenance = await assetService.listMaintenance(req.params.id as string);
  return sendSuccess(res, maintenance);
}
