import { z } from 'zod';
import { paginationQuerySchema } from '@atyantik/shared-types';
import { passwordSchema } from '../auth/auth.validation.js';

// ---------------------------------------------------------------------------
// Enum mirrors (kept in lockstep with prisma/schema.prisma — do not diverge)
// ---------------------------------------------------------------------------

export const GENDER_VALUES = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;
export const MARITAL_STATUS_VALUES = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'] as const;
export const BLOOD_GROUP_VALUES = [
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE',
] as const;
export const EMPLOYMENT_TYPE_VALUES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT'] as const;
export const EMPLOYEE_STATUS_VALUES = [
  'PROBATION',
  'ACTIVE',
  'ON_LEAVE',
  'SUSPENDED',
  'NOTICE_PERIOD',
  'RESIGNED',
  'TERMINATED',
  'ABSCONDED',
] as const;
export const DOCUMENT_CATEGORY_VALUES = [
  'ID_PROOF',
  'ADDRESS_PROOF',
  'EDUCATIONAL',
  'EXPERIENCE',
  'OFFER_LETTER',
  'CONTRACT',
  'PAYSLIP',
  'POLICY',
  'OTHER',
] as const;
export const SKILL_PROFICIENCY_VALUES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;

// ---------------------------------------------------------------------------
// Employee — query / create / update
// ---------------------------------------------------------------------------

export const employeeQuerySchema = paginationQuerySchema.extend({
  departmentId: z.string().min(1).optional(),
  branchId: z.string().min(1).optional(),
  status: z.enum(EMPLOYEE_STATUS_VALUES).optional(),
  employmentType: z.enum(EMPLOYMENT_TYPE_VALUES).optional(),
});

const employeeCoreFields = {
  employeeCode: z.string().min(1).optional(),
  firstName: z.string().min(1),
  middleName: z.string().min(1).optional(),
  lastName: z.string().min(1),
  displayName: z.string().min(1).optional(),
  personalEmail: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  alternatePhone: z.string().min(1).optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(GENDER_VALUES).optional(),
  maritalStatus: z.enum(MARITAL_STATUS_VALUES).optional(),
  bloodGroup: z.enum(BLOOD_GROUP_VALUES).optional(),
  nationality: z.string().min(1).optional(),
  photoUrl: z.string().min(1).optional(),

  companyId: z.string().min(1).optional(),
  branchId: z.string().min(1).optional(),
  departmentId: z.string().min(1).optional(),
  designationId: z.string().min(1).optional(),
  teamId: z.string().min(1).optional(),
  shiftId: z.string().min(1).optional(),
  reportingManagerId: z.string().min(1).optional(),

  employmentType: z.enum(EMPLOYMENT_TYPE_VALUES).optional(),
  status: z.enum(EMPLOYEE_STATUS_VALUES).optional(),
  dateOfJoining: z.coerce.date(),
  probationEndDate: z.coerce.date().optional(),
  confirmationDate: z.coerce.date().optional(),
  dateOfExit: z.coerce.date().optional(),
  noticePeriodDays: z.coerce.number().int().min(0).optional(),

  addressLine1: z.string().min(1).optional(),
  addressLine2: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  postalCode: z.string().min(1).optional(),

  panNumber: z.string().min(1).optional(),
  aadhaarNumber: z.string().min(1).optional(),
  uanNumber: z.string().min(1).optional(),
  pfNumber: z.string().min(1).optional(),
  bankAccountNumber: z.string().min(1).optional(),
  bankIfsc: z.string().min(1).optional(),
  bankName: z.string().min(1).optional(),
};

export const createEmployeeSchema = z.object({
  ...employeeCoreFields,
  email: z.string().email(),
  password: passwordSchema.optional(),
});

export const updateEmployeeSchema = z
  .object({
    ...employeeCoreFields,
    dateOfJoining: z.coerce.date().optional(), // required on create only
  })
  .partial();

export type EmployeeQuery = z.infer<typeof employeeQuerySchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

// ---------------------------------------------------------------------------
// EmployeeDocument
// ---------------------------------------------------------------------------

export const employeeDocumentSchema = z.object({
  category: z.enum(DOCUMENT_CATEGORY_VALUES).default('OTHER'),
  fileUrl: z.string().min(1),
  fileName: z.string().min(1),
});

export type EmployeeDocumentInput = z.infer<typeof employeeDocumentSchema>;

// ---------------------------------------------------------------------------
// EmergencyContact
// ---------------------------------------------------------------------------

export const emergencyContactSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  phone: z.string().min(1),
  altPhone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
});

export const updateEmergencyContactSchema = emergencyContactSchema.partial();

export type EmergencyContactInput = z.infer<typeof emergencyContactSchema>;
export type UpdateEmergencyContactInput = z.infer<typeof updateEmergencyContactSchema>;

// ---------------------------------------------------------------------------
// EducationRecord
// ---------------------------------------------------------------------------

export const educationRecordSchema = z.object({
  degree: z.string().min(1),
  institution: z.string().min(1),
  fieldOfStudy: z.string().min(1).optional(),
  startYear: z.coerce.number().int().optional(),
  endYear: z.coerce.number().int().optional(),
  grade: z.string().min(1).optional(),
  documentUrl: z.string().min(1).optional(),
});

export const updateEducationRecordSchema = educationRecordSchema.partial();

export type EducationRecordInput = z.infer<typeof educationRecordSchema>;
export type UpdateEducationRecordInput = z.infer<typeof updateEducationRecordSchema>;

// ---------------------------------------------------------------------------
// ExperienceRecord
// ---------------------------------------------------------------------------

export const experienceRecordSchema = z.object({
  companyName: z.string().min(1),
  designation: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  description: z.string().min(1).optional(),
  documentUrl: z.string().min(1).optional(),
});

export const updateExperienceRecordSchema = experienceRecordSchema.partial();

export type ExperienceRecordInput = z.infer<typeof experienceRecordSchema>;
export type UpdateExperienceRecordInput = z.infer<typeof updateExperienceRecordSchema>;

// ---------------------------------------------------------------------------
// Certification
// ---------------------------------------------------------------------------

export const certificationSchema = z.object({
  name: z.string().min(1),
  issuingBody: z.string().min(1).optional(),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  credentialId: z.string().min(1).optional(),
  credentialUrl: z.string().min(1).optional(),
});

export const updateCertificationSchema = certificationSchema.partial();

export type CertificationInput = z.infer<typeof certificationSchema>;
export type UpdateCertificationInput = z.infer<typeof updateCertificationSchema>;

// ---------------------------------------------------------------------------
// EmployeeNote
// ---------------------------------------------------------------------------

export const employeeNoteSchema = z.object({
  type: z.string().min(1).default('NOTE'),
  title: z.string().min(1).optional(),
  body: z.string().min(1),
  isConfidential: z.boolean().default(false),
});

export const updateEmployeeNoteSchema = employeeNoteSchema.partial();

export type EmployeeNoteInput = z.infer<typeof employeeNoteSchema>;
export type UpdateEmployeeNoteInput = z.infer<typeof updateEmployeeNoteSchema>;

// ---------------------------------------------------------------------------
// Skill (shared catalog) + EmployeeSkill (assignment)
// ---------------------------------------------------------------------------

export const skillQuerySchema = paginationQuerySchema;

export const skillCatalogSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1).optional(),
});

export const updateSkillCatalogSchema = skillCatalogSchema.partial();

export type SkillQuery = z.infer<typeof skillQuerySchema>;
export type SkillCatalogInput = z.infer<typeof skillCatalogSchema>;
export type UpdateSkillCatalogInput = z.infer<typeof updateSkillCatalogSchema>;

export const employeeSkillSchema = z.object({
  skillId: z.string().min(1),
  proficiency: z.enum(SKILL_PROFICIENCY_VALUES).default('BEGINNER'),
  yearsOfExperience: z.coerce.number().min(0).max(99.9).optional(),
});

export const updateEmployeeSkillSchema = z.object({
  proficiency: z.enum(SKILL_PROFICIENCY_VALUES).optional(),
  yearsOfExperience: z.coerce.number().min(0).max(99.9).optional(),
});

export type EmployeeSkillInput = z.infer<typeof employeeSkillSchema>;
export type UpdateEmployeeSkillInput = z.infer<typeof updateEmployeeSkillSchema>;
