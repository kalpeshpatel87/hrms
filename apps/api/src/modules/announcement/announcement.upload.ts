import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../lib/ApiError.js';

/** Images, PDF, and Word docs — the common set of files an announcement would legitimately attach. */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(ApiError.badRequest(`Unsupported file type "${file.mimetype}". Allowed: images, PDF, DOC/DOCX.`));
      return;
    }
    cb(null, true);
  },
});

/**
 * Wraps multer's single-file middleware so both fileFilter rejections and
 * size-limit overruns surface as a normal ApiError (400 via the central
 * errorHandler) instead of an uncaught MulterError falling through to the
 * generic 500 handler.
 */
export function uploadSingleAttachment(req: Request, res: Response, next: NextFunction) {
  upload.single('file')(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(ApiError.badRequest('File exceeds the 10MB size limit'));
      }
      return next(ApiError.badRequest(err.message));
    }
    return next(err);
  });
}
