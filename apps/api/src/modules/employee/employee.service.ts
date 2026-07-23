import { randomInt } from 'node:crypto';
import bcrypt from 'bcrypt';
import type { Prisma } from '@prisma/client';
import { prisma, softDelete } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { recordAuditLog } from '../../lib/auditLog.js';
import { buildPagination } from '../../lib/response.js';
import type { AccessTokenPayload } from '../../lib/jwt.js';
import type {
  CertificationInput,
  CreateEmployeeInput,
  EducationRecordInput,
  EmergencyContactInput,
  EmployeeDocumentInput,
  EmployeeNoteInput,
  EmployeeQuery,
  EmployeeSkillInput,
  SkillCatalogInput,
  SkillQuery,
  UpdateCertificationInput,
  UpdateEducationRecordInput,
  UpdateEmergencyContactInput,
  UpdateEmployeeInput,
  UpdateEmployeeNoteInput,
  UpdateEmployeeSkillInput,
  UpdateSkillCatalogInput,
  UpdateExperienceRecordInput,
  ExperienceRecordInput,
} from './employee.validation.js';

const BCRYPT_ROUNDS = 12;
const EMPLOYEE_ROLE_SLUG = 'employee';

// ---------------------------------------------------------------------------
// Shared includes / helpers
// ---------------------------------------------------------------------------

const employeeListInclude = {
  department: { select: { id: true, name: true, code: true } },
  designation: { select: { id: true, title: true } },
  branch: { select: { id: true, name: true, code: true } },
  team: { select: { id: true, name: true } },
  reportingManager: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
  user: { select: { id: true, email: true, isActive: true, mustChangePassword: true } },
} satisfies Prisma.EmployeeInclude;

const employeeFullInclude = {
  ...employeeListInclude,
  company: { select: { id: true, name: true } },
  shift: true,
  directReports: {
    where: { deletedAt: null },
    select: { id: true, firstName: true, lastName: true, employeeCode: true, status: true },
  },
  documents: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
  emergencyContacts: { where: { deletedAt: null } },
  educationRecords: { where: { deletedAt: null } },
  experienceRecords: { where: { deletedAt: null } },
  employeeSkills: { where: { deletedAt: null }, include: { skill: true } },
  certifications: { where: { deletedAt: null } },
  notes: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, email: true } } },
  },
} satisfies Prisma.EmployeeInclude;

function generateTempPassword(): string {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = lower.toUpperCase();
  const digits = '0123456789';
  const special = '!@#$%^&*';
  const all = lower + upper + digits + special;
  const pick = (set: string) => set[randomInt(set.length)];

  const required = [pick(lower), pick(upper), pick(digits), pick(special)];
  const rest = Array.from({ length: 8 }, () => pick(all));
  const chars = [...required, ...rest];

  // Shuffle so the required classes aren't always in the same positions.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

async function generateEmployeeCode(): Promise<string> {
  const total = await prisma.employee.count({ where: { deletedAt: undefined } });
  for (let attempt = 0; attempt < 50; attempt++) {
    const code = `EMP-${String(total + 1 + attempt).padStart(5, '0')}`;
    const exists = await prisma.employee.findFirst({ where: { employeeCode: code, deletedAt: undefined } });
    if (!exists) return code;
  }
  throw ApiError.internal('Failed to generate a unique employee code');
}

async function resolveCompanyId(companyId?: string): Promise<string> {
  if (companyId) return companyId;
  const company = await prisma.company.findFirst();
  if (!company) throw ApiError.badRequest('No company is configured; companyId is required');
  return company.id;
}

function requesterCanReadAll(requester: AccessTokenPayload): boolean {
  return requester.permissions.includes('employee:read');
}

function requesterCanManage(requester: AccessTokenPayload): boolean {
  return requester.permissions.includes('employee:update');
}

/** Confidential notes are visible only to their author or someone with employee:update. */
function filterConfidentialNotes<T extends { isConfidential: boolean; authorId: string }>(
  notes: T[],
  requester: AccessTokenPayload,
): T[] {
  if (requesterCanManage(requester)) return notes;
  return notes.filter((note) => !note.isConfidential || note.authorId === requester.sub);
}

async function assertEmployeeExists(employeeId: string) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw ApiError.notFound('Employee not found');
  return employee;
}

// ---------------------------------------------------------------------------
// Employee — list / create / read / update / delete
// ---------------------------------------------------------------------------

export async function listEmployees(query: EmployeeQuery) {
  const { page, pageSize, sortBy, sortDir, search, departmentId, branchId, status, employmentType } = query;

  const where: Prisma.EmployeeWhereInput = {
    ...(departmentId && { departmentId }),
    ...(branchId && { branchId }),
    ...(status && { status }),
    ...(employmentType && { employmentType }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { personalEmail: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ],
    }),
  };

  const allowedSortFields = new Set(['firstName', 'lastName', 'employeeCode', 'dateOfJoining', 'status', 'createdAt']);
  const orderByField = sortBy && allowedSortFields.has(sortBy) ? sortBy : 'createdAt';

  const [items, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: employeeListInclude,
      orderBy: { [orderByField]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.employee.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: buildPagination(total, page, pageSize).totalPages };
}

export async function createEmployee(input: CreateEmployeeInput) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) throw ApiError.conflict('A user with this email already exists');

  const employeeRole = await prisma.role.findUnique({ where: { slug: EMPLOYEE_ROLE_SLUG } });
  if (!employeeRole) throw ApiError.internal('Default "employee" role is not seeded');

  const companyId = await resolveCompanyId(input.companyId);
  const employeeCode = input.employeeCode ?? (await generateEmployeeCode());

  const generatedPassword = input.password ? undefined : generateTempPassword();
  const passwordHash = await bcrypt.hash(input.password ?? generatedPassword!, BCRYPT_ROUNDS);

  const { email, password: _password, employeeCode: _employeeCode, companyId: _companyId, ...employeeFields } = input;

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, passwordHash, mustChangePassword: true, isActive: true },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: employeeRole.id, assignedBy: user.id } });
    const employee = await tx.employee.create({
      data: { ...employeeFields, userId: user.id, employeeCode, companyId },
      include: employeeListInclude,
    });
    return { user, employee };
  });

  await recordAuditLog({ action: 'CREATE', entityType: 'Employee', entityId: created.employee.id, after: created.employee });

  return { ...created.employee, temporaryPassword: generatedPassword };
}

export async function getEmployeeById(id: string, requester: AccessTokenPayload) {
  const employee = await prisma.employee.findUnique({ where: { id }, include: employeeFullInclude });
  if (!employee) throw ApiError.notFound('Employee not found');

  if (!requesterCanReadAll(requester) && employee.userId !== requester.sub) {
    throw ApiError.forbidden();
  }

  return { ...employee, notes: filterConfidentialNotes(employee.notes, requester) };
}

export async function getMyEmployeeProfile(requester: AccessTokenPayload) {
  const employee = await prisma.employee.findUnique({ where: { userId: requester.sub }, include: employeeFullInclude });
  if (!employee) throw ApiError.notFound('No employee profile is linked to this account');

  return { ...employee, notes: filterConfidentialNotes(employee.notes, requester) };
}

/** Resolves the calling user's own Employee row, or throws if none exists. */
export async function resolveOwnEmployee(userId: string) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw ApiError.notFound('No employee profile is linked to this account');
  return employee;
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput) {
  const before = await assertEmployeeExists(id);

  const updated = await prisma.employee.update({
    where: { id },
    data: input,
    include: employeeListInclude,
  });

  await recordAuditLog({ action: 'UPDATE', entityType: 'Employee', entityId: id, before, after: updated });
  return updated;
}

export async function deleteEmployee(id: string) {
  const employee = await assertEmployeeExists(id);

  await softDelete('Employee', id);
  await prisma.user.update({ where: { id: employee.userId }, data: { isActive: false, tokenVersion: { increment: 1 } } });
  await prisma.refreshToken.updateMany({ where: { userId: employee.userId, revokedAt: null }, data: { revokedAt: new Date() } });

  await recordAuditLog({ action: 'DELETE', entityType: 'Employee', entityId: id, before: employee });
}

// ---------------------------------------------------------------------------
// Org chart
// ---------------------------------------------------------------------------

export async function getOrgChartTree() {
  return prisma.employee.findMany({
    where: { reportingManagerId: null },
    include: {
      department: { select: { id: true, name: true } },
      designation: { select: { id: true, title: true } },
      directReports: {
        where: { deletedAt: null },
        include: {
          department: { select: { id: true, name: true } },
          designation: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { firstName: 'asc' },
  });
}

export async function getEmployeeOrgChart(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true } },
      designation: { select: { id: true, title: true } },
      reportingManager: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: { select: { id: true, title: true } } },
      },
      directReports: {
        where: { deletedAt: null },
        include: {
          department: { select: { id: true, name: true } },
          designation: { select: { id: true, title: true } },
        },
      },
    },
  });
  if (!employee) throw ApiError.notFound('Employee not found');
  return employee;
}

// ---------------------------------------------------------------------------
// EmployeeDocument
// ---------------------------------------------------------------------------

export async function listDocuments(employeeId: string) {
  await assertEmployeeExists(employeeId);
  return prisma.employeeDocument.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' } });
}

export async function addDocument(employeeId: string, input: EmployeeDocumentInput) {
  await assertEmployeeExists(employeeId);
  const document = await prisma.employeeDocument.create({ data: { ...input, employeeId } });
  await recordAuditLog({ action: 'CREATE', entityType: 'EmployeeDocument', entityId: document.id, after: document });
  return document;
}

export async function deleteDocument(employeeId: string, documentId: string) {
  const document = await prisma.employeeDocument.findFirst({ where: { id: documentId, employeeId } });
  if (!document) throw ApiError.notFound('Document not found');
  await softDelete('EmployeeDocument', documentId);
  await recordAuditLog({ action: 'DELETE', entityType: 'EmployeeDocument', entityId: documentId, before: document });
}

// ---------------------------------------------------------------------------
// EmergencyContact
// ---------------------------------------------------------------------------

export async function listEmergencyContacts(employeeId: string) {
  await assertEmployeeExists(employeeId);
  return prisma.emergencyContact.findMany({ where: { employeeId }, orderBy: { createdAt: 'asc' } });
}

export async function addEmergencyContact(employeeId: string, input: EmergencyContactInput) {
  await assertEmployeeExists(employeeId);
  const contact = await prisma.emergencyContact.create({ data: { ...input, employeeId } });
  await recordAuditLog({ action: 'CREATE', entityType: 'EmergencyContact', entityId: contact.id, after: contact });
  return contact;
}

export async function updateEmergencyContact(employeeId: string, contactId: string, input: UpdateEmergencyContactInput) {
  const before = await prisma.emergencyContact.findFirst({ where: { id: contactId, employeeId } });
  if (!before) throw ApiError.notFound('Emergency contact not found');
  const updated = await prisma.emergencyContact.update({ where: { id: contactId }, data: input });
  await recordAuditLog({ action: 'UPDATE', entityType: 'EmergencyContact', entityId: contactId, before, after: updated });
  return updated;
}

export async function deleteEmergencyContact(employeeId: string, contactId: string) {
  const contact = await prisma.emergencyContact.findFirst({ where: { id: contactId, employeeId } });
  if (!contact) throw ApiError.notFound('Emergency contact not found');
  await softDelete('EmergencyContact', contactId);
  await recordAuditLog({ action: 'DELETE', entityType: 'EmergencyContact', entityId: contactId, before: contact });
}

// ---------------------------------------------------------------------------
// EducationRecord
// ---------------------------------------------------------------------------

export async function listEducationRecords(employeeId: string) {
  await assertEmployeeExists(employeeId);
  return prisma.educationRecord.findMany({ where: { employeeId }, orderBy: { startYear: 'desc' } });
}

export async function addEducationRecord(employeeId: string, input: EducationRecordInput) {
  await assertEmployeeExists(employeeId);
  const record = await prisma.educationRecord.create({ data: { ...input, employeeId } });
  await recordAuditLog({ action: 'CREATE', entityType: 'EducationRecord', entityId: record.id, after: record });
  return record;
}

export async function updateEducationRecord(employeeId: string, recordId: string, input: UpdateEducationRecordInput) {
  const before = await prisma.educationRecord.findFirst({ where: { id: recordId, employeeId } });
  if (!before) throw ApiError.notFound('Education record not found');
  const updated = await prisma.educationRecord.update({ where: { id: recordId }, data: input });
  await recordAuditLog({ action: 'UPDATE', entityType: 'EducationRecord', entityId: recordId, before, after: updated });
  return updated;
}

export async function deleteEducationRecord(employeeId: string, recordId: string) {
  const record = await prisma.educationRecord.findFirst({ where: { id: recordId, employeeId } });
  if (!record) throw ApiError.notFound('Education record not found');
  await softDelete('EducationRecord', recordId);
  await recordAuditLog({ action: 'DELETE', entityType: 'EducationRecord', entityId: recordId, before: record });
}

// ---------------------------------------------------------------------------
// ExperienceRecord
// ---------------------------------------------------------------------------

export async function listExperienceRecords(employeeId: string) {
  await assertEmployeeExists(employeeId);
  return prisma.experienceRecord.findMany({ where: { employeeId }, orderBy: { startDate: 'desc' } });
}

export async function addExperienceRecord(employeeId: string, input: ExperienceRecordInput) {
  await assertEmployeeExists(employeeId);
  const record = await prisma.experienceRecord.create({ data: { ...input, employeeId } });
  await recordAuditLog({ action: 'CREATE', entityType: 'ExperienceRecord', entityId: record.id, after: record });
  return record;
}

export async function updateExperienceRecord(employeeId: string, recordId: string, input: UpdateExperienceRecordInput) {
  const before = await prisma.experienceRecord.findFirst({ where: { id: recordId, employeeId } });
  if (!before) throw ApiError.notFound('Experience record not found');
  const updated = await prisma.experienceRecord.update({ where: { id: recordId }, data: input });
  await recordAuditLog({ action: 'UPDATE', entityType: 'ExperienceRecord', entityId: recordId, before, after: updated });
  return updated;
}

export async function deleteExperienceRecord(employeeId: string, recordId: string) {
  const record = await prisma.experienceRecord.findFirst({ where: { id: recordId, employeeId } });
  if (!record) throw ApiError.notFound('Experience record not found');
  await softDelete('ExperienceRecord', recordId);
  await recordAuditLog({ action: 'DELETE', entityType: 'ExperienceRecord', entityId: recordId, before: record });
}

// ---------------------------------------------------------------------------
// Certification
// ---------------------------------------------------------------------------

export async function listCertifications(employeeId: string) {
  await assertEmployeeExists(employeeId);
  return prisma.certification.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' } });
}

export async function addCertification(employeeId: string, input: CertificationInput) {
  await assertEmployeeExists(employeeId);
  const record = await prisma.certification.create({ data: { ...input, employeeId } });
  await recordAuditLog({ action: 'CREATE', entityType: 'Certification', entityId: record.id, after: record });
  return record;
}

export async function updateCertification(employeeId: string, certificationId: string, input: UpdateCertificationInput) {
  const before = await prisma.certification.findFirst({ where: { id: certificationId, employeeId } });
  if (!before) throw ApiError.notFound('Certification not found');
  const updated = await prisma.certification.update({ where: { id: certificationId }, data: input });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Certification', entityId: certificationId, before, after: updated });
  return updated;
}

export async function deleteCertification(employeeId: string, certificationId: string) {
  const record = await prisma.certification.findFirst({ where: { id: certificationId, employeeId } });
  if (!record) throw ApiError.notFound('Certification not found');
  await softDelete('Certification', certificationId);
  await recordAuditLog({ action: 'DELETE', entityType: 'Certification', entityId: certificationId, before: record });
}

// ---------------------------------------------------------------------------
// EmployeeNote (confidentiality-aware)
// ---------------------------------------------------------------------------

export async function listNotes(employeeId: string, requester: AccessTokenPayload) {
  await assertEmployeeExists(employeeId);
  const notes = await prisma.employeeNote.findMany({
    where: { employeeId },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, email: true } } },
  });
  return filterConfidentialNotes(notes, requester);
}

export async function addNote(employeeId: string, authorId: string, input: EmployeeNoteInput) {
  await assertEmployeeExists(employeeId);
  const note = await prisma.employeeNote.create({ data: { ...input, employeeId, authorId } });
  await recordAuditLog({ action: 'CREATE', entityType: 'EmployeeNote', entityId: note.id, after: note });
  return note;
}

export async function updateNote(employeeId: string, noteId: string, input: UpdateEmployeeNoteInput) {
  const before = await prisma.employeeNote.findFirst({ where: { id: noteId, employeeId } });
  if (!before) throw ApiError.notFound('Note not found');
  const updated = await prisma.employeeNote.update({ where: { id: noteId }, data: input });
  await recordAuditLog({ action: 'UPDATE', entityType: 'EmployeeNote', entityId: noteId, before, after: updated });
  return updated;
}

export async function deleteNote(employeeId: string, noteId: string) {
  const note = await prisma.employeeNote.findFirst({ where: { id: noteId, employeeId } });
  if (!note) throw ApiError.notFound('Note not found');
  await softDelete('EmployeeNote', noteId);
  await recordAuditLog({ action: 'DELETE', entityType: 'EmployeeNote', entityId: noteId, before: note });
}

// ---------------------------------------------------------------------------
// Skill (shared catalog — admin CRUD)
// ---------------------------------------------------------------------------

export async function listSkillsCatalog(query: SkillQuery) {
  const { page, pageSize, sortDir, search } = query;
  const where: Prisma.SkillWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.skill.findMany({ where, orderBy: { name: sortDir }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.skill.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: buildPagination(total, page, pageSize).totalPages };
}

export async function createSkillCatalogEntry(input: SkillCatalogInput) {
  const existing = await prisma.skill.findUnique({ where: { name: input.name } });
  if (existing) throw ApiError.conflict('A skill with this name already exists in the catalog');
  const skill = await prisma.skill.create({ data: input });
  await recordAuditLog({ action: 'CREATE', entityType: 'Skill', entityId: skill.id, after: skill });
  return skill;
}

export async function updateSkillCatalogEntry(skillId: string, input: UpdateSkillCatalogInput) {
  const before = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!before) throw ApiError.notFound('Skill not found');
  const updated = await prisma.skill.update({ where: { id: skillId }, data: input });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Skill', entityId: skillId, before, after: updated });
  return updated;
}

export async function deleteSkillCatalogEntry(skillId: string) {
  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) throw ApiError.notFound('Skill not found');
  await softDelete('Skill', skillId);
  await recordAuditLog({ action: 'DELETE', entityType: 'Skill', entityId: skillId, before: skill });
}

// ---------------------------------------------------------------------------
// EmployeeSkill (assignment of a catalog Skill to an Employee)
// ---------------------------------------------------------------------------

export async function listEmployeeSkills(employeeId: string) {
  await assertEmployeeExists(employeeId);
  return prisma.employeeSkill.findMany({ where: { employeeId }, include: { skill: true }, orderBy: { createdAt: 'desc' } });
}

export async function addEmployeeSkill(employeeId: string, input: EmployeeSkillInput) {
  await assertEmployeeExists(employeeId);

  const skill = await prisma.skill.findUnique({ where: { id: input.skillId } });
  if (!skill) throw ApiError.notFound('Skill not found in catalog');

  const existing = await prisma.employeeSkill.findFirst({ where: { employeeId, skillId: input.skillId } });
  if (existing) throw ApiError.conflict('This skill is already assigned to the employee');

  const assignment = await prisma.employeeSkill.create({ data: { ...input, employeeId }, include: { skill: true } });
  await recordAuditLog({ action: 'CREATE', entityType: 'EmployeeSkill', entityId: assignment.id, after: assignment });
  return assignment;
}

export async function updateEmployeeSkill(employeeId: string, employeeSkillId: string, input: UpdateEmployeeSkillInput) {
  const before = await prisma.employeeSkill.findFirst({ where: { id: employeeSkillId, employeeId } });
  if (!before) throw ApiError.notFound('Skill assignment not found');
  const updated = await prisma.employeeSkill.update({ where: { id: employeeSkillId }, data: input, include: { skill: true } });
  await recordAuditLog({ action: 'UPDATE', entityType: 'EmployeeSkill', entityId: employeeSkillId, before, after: updated });
  return updated;
}

export async function removeEmployeeSkill(employeeId: string, employeeSkillId: string) {
  const assignment = await prisma.employeeSkill.findFirst({ where: { id: employeeSkillId, employeeId } });
  if (!assignment) throw ApiError.notFound('Skill assignment not found');
  await softDelete('EmployeeSkill', employeeSkillId);
  await recordAuditLog({ action: 'DELETE', entityType: 'EmployeeSkill', entityId: employeeSkillId, before: assignment });
}
