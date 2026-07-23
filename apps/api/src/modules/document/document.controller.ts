import type { Request, Response } from 'express';
import { ApiError } from '../../lib/ApiError.js';
import { sendCreated, sendPaginated, sendSuccess } from '../../lib/response.js';
import { prisma } from '../../db/prisma.js';
import * as documentService from './document.service.js';
import type { CreateDocumentMetaInput, DocumentQuery } from './document.validation.js';

export async function listDocumentsHandler(req: Request, res: Response) {
  const query = req.query as unknown as DocumentQuery;
  const result = await documentService.listDocuments(query);
  return sendPaginated(res, result);
}

export async function listMyDocumentsHandler(req: Request, res: Response) {
  const query = req.query as unknown as DocumentQuery;
  const result = await documentService.listMyDocuments(req.user!.sub, query);
  return sendPaginated(res, result);
}

export async function createDocumentHandler(req: Request, res: Response) {
  if (!req.file) throw ApiError.badRequest('No file was uploaded');
  const body = req.body as CreateDocumentMetaInput;

  const employee = await prisma.employee.findUnique({ where: { userId: req.user!.sub } });
  const document = await documentService.createDocument(body, req.file, employee?.id);
  return sendCreated(res, document);
}

export async function addVersionHandler(req: Request, res: Response) {
  if (!req.file) throw ApiError.badRequest('No file was uploaded');
  const document = await documentService.addVersion(req.params.id as string, req.file);
  return sendSuccess(res, document, 'New version uploaded successfully');
}

export async function downloadDocumentHandler(req: Request, res: Response) {
  const version = await documentService.getDocumentForDownload(req.params.id as string, req.user!);
  return res.redirect(version.fileUrl);
}

export async function deleteDocumentHandler(req: Request, res: Response) {
  await documentService.deleteDocument(req.params.id as string);
  return sendSuccess(res, null, 'Document deleted successfully');
}
