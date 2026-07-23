import type { Request, Response } from 'express';
import { ApiError } from '../../lib/ApiError.js';
import { sendCreated, sendSuccess } from '../../lib/response.js';
import * as announcementService from './announcement.service.js';
import type { AnnouncementQuery, CreateAnnouncementInput, UpdateAnnouncementInput } from './announcement.validation.js';

export async function listAnnouncementsHandler(req: Request, res: Response) {
  const query = req.query as unknown as AnnouncementQuery;
  const result = await announcementService.listVisibleAnnouncements(req.user!.sub, query);
  return sendSuccess(res, result);
}

export async function getAnnouncementHandler(req: Request, res: Response) {
  const announcement = await announcementService.getVisibleAnnouncementOrThrow(req.params.id as string, req.user!.sub);
  return sendSuccess(res, announcement);
}

export async function createAnnouncementHandler(req: Request, res: Response) {
  const body = req.body as CreateAnnouncementInput;
  const announcement = await announcementService.createAnnouncement(body);
  return sendCreated(res, announcement, 'Announcement published successfully');
}

export async function updateAnnouncementHandler(req: Request, res: Response) {
  const body = req.body as UpdateAnnouncementInput;
  const announcement = await announcementService.updateAnnouncement(req.params.id as string, body);
  return sendSuccess(res, announcement, 'Announcement updated successfully');
}

export async function deleteAnnouncementHandler(req: Request, res: Response) {
  await announcementService.removeAnnouncement(req.params.id as string);
  return sendSuccess(res, null, 'Announcement deleted successfully');
}

export async function addAttachmentHandler(req: Request, res: Response) {
  if (!req.file) throw ApiError.badRequest('No file was uploaded');
  const attachment = await announcementService.addAttachment(req.params.id as string, req.file);
  return sendCreated(res, attachment);
}

export async function removeAttachmentHandler(req: Request, res: Response) {
  await announcementService.removeAttachment(req.params.id as string, req.params.attachmentId as string);
  return sendSuccess(res, null, 'Attachment removed successfully');
}
