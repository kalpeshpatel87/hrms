import type { Request, Response } from 'express';
import { sendCreated, sendPaginated, sendSuccess } from '../../lib/response.js';
import * as learningService from './learning.service.js';
import type {
  AssessmentInput,
  CourseInput,
  CourseQuery,
  EnrollmentQuery,
  UpdateCourseInput,
  UpdateEnrollmentProgressInput,
} from './learning.validation.js';

export async function listCoursesHandler(req: Request, res: Response) {
  const query = req.query as unknown as CourseQuery;
  const result = await learningService.listCourses(query);
  return sendPaginated(res, result);
}

export async function createCourseHandler(req: Request, res: Response) {
  const body = req.body as CourseInput;
  const course = await learningService.createCourse(body);
  return sendCreated(res, course);
}

export async function updateCourseHandler(req: Request, res: Response) {
  const body = req.body as UpdateCourseInput;
  const course = await learningService.updateCourse(req.params.id as string, body);
  return sendSuccess(res, course, 'Course updated successfully');
}

export async function deleteCourseHandler(req: Request, res: Response) {
  await learningService.deleteCourse(req.params.id as string);
  return sendSuccess(res, null, 'Course deleted successfully');
}

export async function enrollInCourseHandler(req: Request, res: Response) {
  const enrollment = await learningService.enrollInCourse(req.params.id as string, req.user!.sub);
  return sendCreated(res, enrollment);
}

export async function listMyEnrollmentsHandler(req: Request, res: Response) {
  const query = req.query as unknown as EnrollmentQuery;
  const result = await learningService.listMyEnrollments(req.user!.sub, query);
  return sendPaginated(res, result);
}

export async function updateEnrollmentProgressHandler(req: Request, res: Response) {
  const body = req.body as UpdateEnrollmentProgressInput;
  const enrollment = await learningService.updateEnrollmentProgress(req.user!.sub, req.params.id as string, body);
  return sendSuccess(res, enrollment, 'Progress updated successfully');
}

export async function addAssessmentHandler(req: Request, res: Response) {
  const body = req.body as AssessmentInput;
  const assessment = await learningService.addAssessment(req.user!.sub, req.params.id as string, body);
  return sendCreated(res, assessment);
}
