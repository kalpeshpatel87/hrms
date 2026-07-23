import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './attendance.controller.js';
import {
  attendanceQuerySchema,
  breakInSchema,
  breakOutSchema,
  checkInSchema,
  checkOutSchema,
  correctionRequestQuerySchema,
  createCorrectionRequestSchema,
  myAttendanceQuerySchema,
  updateAttendanceSchema,
} from './attendance.validation.js';

export const attendanceRoutes = Router();

/**
 * @openapi
 * /attendance/check-in:
 *   post:
 *     summary: Self-service check-in for today (computes LATE vs PRESENT from the caller's shift)
 *     tags: [Attendance]
 */
attendanceRoutes.post(
  '/check-in',
  ...requireAuth(),
  validate(checkInSchema),
  asyncHandler(controller.checkInHandler),
);

/**
 * @openapi
 * /attendance/check-out:
 *   post:
 *     summary: Self-service check-out for today (computes totalWorkMinutes)
 *     tags: [Attendance]
 */
attendanceRoutes.post(
  '/check-out',
  ...requireAuth(),
  validate(checkOutSchema),
  asyncHandler(controller.checkOutHandler),
);

/**
 * @openapi
 * /attendance/break-in:
 *   post:
 *     summary: Self-service start of a break on today's attendance record
 *     tags: [Attendance]
 */
attendanceRoutes.post(
  '/break-in',
  ...requireAuth(),
  validate(breakInSchema),
  asyncHandler(controller.breakInHandler),
);

/**
 * @openapi
 * /attendance/break-out:
 *   post:
 *     summary: Self-service end of the current break; recomputes totalBreakMinutes
 *     tags: [Attendance]
 */
attendanceRoutes.post(
  '/break-out',
  ...requireAuth(),
  validate(breakOutSchema),
  asyncHandler(controller.breakOutHandler),
);

/**
 * @openapi
 * /attendance/me:
 *   get:
 *     summary: Caller's own attendance for a given month/year (defaults to current month)
 *     tags: [Attendance]
 */
attendanceRoutes.get(
  '/me',
  ...requireAuth(),
  validate(myAttendanceQuerySchema, 'query'),
  asyncHandler(controller.getMyAttendanceHandler),
);

/**
 * @openapi
 * /attendance/correction-requests:
 *   get:
 *     summary: Approval queue for attendance correction requests
 *     tags: [Attendance]
 *   post:
 *     summary: Self-service request to correct one of the caller's own attendance records
 *     tags: [Attendance]
 */
attendanceRoutes.get(
  '/correction-requests',
  ...requireAuth('attendance:approve'),
  validate(correctionRequestQuerySchema, 'query'),
  asyncHandler(controller.listCorrectionRequestsHandler),
);

attendanceRoutes.post(
  '/correction-requests',
  ...requireAuth(),
  validate(createCorrectionRequestSchema),
  asyncHandler(controller.createCorrectionRequestHandler),
);

/**
 * @openapi
 * /attendance/correction-requests/{id}/approve:
 *   post:
 *     summary: Approve a correction request — applies requested times to the AttendanceRecord
 *     tags: [Attendance]
 */
attendanceRoutes.post(
  '/correction-requests/:id/approve',
  ...requireAuth('attendance:approve'),
  asyncHandler(controller.approveCorrectionRequestHandler),
);

/**
 * @openapi
 * /attendance/correction-requests/{id}/reject:
 *   post:
 *     summary: Reject a correction request
 *     tags: [Attendance]
 */
attendanceRoutes.post(
  '/correction-requests/:id/reject',
  ...requireAuth('attendance:approve'),
  asyncHandler(controller.rejectCorrectionRequestHandler),
);

/**
 * @openapi
 * /attendance:
 *   get:
 *     summary: Admin/manager paginated attendance list, filterable by employee/department/status/date range
 *     tags: [Attendance]
 */
attendanceRoutes.get(
  '/',
  ...requireAuth('attendance:read'),
  validate(attendanceQuerySchema, 'query'),
  asyncHandler(controller.listAttendanceHandler),
);

/**
 * @openapi
 * /attendance/{id}:
 *   patch:
 *     summary: Manual admin correction of an attendance record
 *     tags: [Attendance]
 */
attendanceRoutes.patch(
  '/:id',
  ...requireAuth('attendance:update'),
  validate(updateAttendanceSchema),
  asyncHandler(controller.updateAttendanceHandler),
);
