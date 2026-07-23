import type { Prisma } from '@prisma/client';
import { prisma, softDelete } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { recordAuditLog } from '../../lib/auditLog.js';
import { buildPagination } from '../../lib/response.js';
import type {
  AssessmentInput,
  CourseInput,
  CourseQuery,
  EnrollmentQuery,
  UpdateCourseInput,
  UpdateEnrollmentProgressInput,
} from './learning.validation.js';

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

export async function listCourses(query: CourseQuery) {
  const where: Prisma.CourseWhereInput = query.search
    ? { title: { contains: query.search, mode: 'insensitive' } }
    : {};
  const [items, total] = await Promise.all([
    prisma.course.findMany({ where, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
    prisma.course.count({ where }),
  ]);
  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function createCourse(input: CourseInput) {
  const companyId = await resolveCompanyId();
  const course = await prisma.course.create({ data: { ...input, companyId } });
  await recordAuditLog({ action: 'CREATE', entityType: 'Course', entityId: course.id, after: course });
  return course;
}

export async function updateCourse(id: string, input: UpdateCourseInput) {
  const before = await prisma.course.findUnique({ where: { id } });
  if (!before) throw ApiError.notFound('Course not found');
  const updated = await prisma.course.update({ where: { id }, data: input });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Course', entityId: id, before, after: updated });
  return updated;
}

export async function deleteCourse(id: string) {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw ApiError.notFound('Course not found');
  await softDelete('Course', id);
  await recordAuditLog({ action: 'DELETE', entityType: 'Course', entityId: id, before: course });
}

const enrollmentInclude = { course: true, assessments: true } satisfies Prisma.EnrollmentInclude;

export async function enrollInCourse(courseId: string, userId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw ApiError.notFound('Course not found');
  const employee = await resolveEmployeeForUser(userId);

  const existing = await prisma.enrollment.findUnique({ where: { courseId_employeeId: { courseId, employeeId: employee.id } } });
  if (existing) throw ApiError.conflict('Already enrolled in this course');

  const enrollment = await prisma.enrollment.create({
    data: { courseId, employeeId: employee.id },
    include: enrollmentInclude,
  });
  await recordAuditLog({ action: 'CREATE', entityType: 'Enrollment', entityId: enrollment.id, after: enrollment });
  return enrollment;
}

export async function listMyEnrollments(userId: string, query: EnrollmentQuery) {
  const employee = await resolveEmployeeForUser(userId);
  const where: Prisma.EnrollmentWhereInput = { employeeId: employee.id };
  if (query.status) where.status = query.status;

  const [items, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      include: enrollmentInclude,
      orderBy: { enrolledAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.enrollment.count({ where }),
  ]);
  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function updateEnrollmentProgress(userId: string, enrollmentId: string, input: UpdateEnrollmentProgressInput) {
  const employee = await resolveEmployeeForUser(userId);
  const enrollment = await prisma.enrollment.findFirst({ where: { id: enrollmentId, employeeId: employee.id } });
  if (!enrollment) throw ApiError.notFound('Enrollment not found');

  const data: Prisma.EnrollmentUpdateInput = { ...input };
  if (input.status === 'COMPLETED') data.completedAt = new Date();

  const updated = await prisma.enrollment.update({ where: { id: enrollmentId }, data, include: enrollmentInclude });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Enrollment', entityId: enrollmentId, after: updated });
  return updated;
}

export async function addAssessment(userId: string, enrollmentId: string, input: AssessmentInput) {
  const employee = await resolveEmployeeForUser(userId);
  const enrollment = await prisma.enrollment.findFirst({ where: { id: enrollmentId, employeeId: employee.id } });
  if (!enrollment) throw ApiError.notFound('Enrollment not found');

  const assessment = await prisma.assessment.create({ data: { ...input, enrollmentId } });
  await recordAuditLog({ action: 'CREATE', entityType: 'Assessment', entityId: assessment.id, after: assessment });
  return assessment;
}
