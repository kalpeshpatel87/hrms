import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './employee.controller.js';
import {
  certificationSchema,
  createEmployeeSchema,
  educationRecordSchema,
  emergencyContactSchema,
  employeeDocumentSchema,
  employeeNoteSchema,
  employeeQuerySchema,
  employeeSkillSchema,
  experienceRecordSchema,
  skillCatalogSchema,
  skillQuerySchema,
  updateCertificationSchema,
  updateEducationRecordSchema,
  updateEmergencyContactSchema,
  updateEmployeeNoteSchema,
  updateEmployeeSchema,
  updateEmployeeSkillSchema,
  updateExperienceRecordSchema,
  updateSkillCatalogSchema,
} from './employee.validation.js';

export const employeeRoutes = Router();

// ---------------------------------------------------------------------------
// Skill catalog (mounted before /:id routes — distinct 2-segment path so it
// never collides with the single-segment /:id pattern below)
// ---------------------------------------------------------------------------

employeeRoutes.get(
  '/catalog/skills',
  ...requireAuth('employee:read'),
  validate(skillQuerySchema, 'query'),
  asyncHandler(controller.listSkillsCatalogHandler),
);
employeeRoutes.post(
  '/catalog/skills',
  ...requireAuth('employee:update'),
  validate(skillCatalogSchema),
  asyncHandler(controller.createSkillCatalogEntryHandler),
);
employeeRoutes.patch(
  '/catalog/skills/:id',
  ...requireAuth('employee:update'),
  validate(updateSkillCatalogSchema),
  asyncHandler(controller.updateSkillCatalogEntryHandler),
);
employeeRoutes.delete(
  '/catalog/skills/:id',
  ...requireAuth('employee:update'),
  asyncHandler(controller.deleteSkillCatalogEntryHandler),
);

// ---------------------------------------------------------------------------
// Org chart (also before /:id)
// ---------------------------------------------------------------------------

employeeRoutes.get('/org-chart/tree', ...requireAuth('employee:read'), asyncHandler(controller.getOrgChartTreeHandler));

// ---------------------------------------------------------------------------
// Self-service
// ---------------------------------------------------------------------------

employeeRoutes.get('/me', ...requireAuth(), asyncHandler(controller.getMeHandler));

// ---------------------------------------------------------------------------
// Employee CRUD
// ---------------------------------------------------------------------------

employeeRoutes.get(
  '/',
  ...requireAuth('employee:read'),
  validate(employeeQuerySchema, 'query'),
  asyncHandler(controller.listEmployeesHandler),
);
employeeRoutes.post(
  '/',
  ...requireAuth('employee:create'),
  validate(createEmployeeSchema),
  asyncHandler(controller.createEmployeeHandler),
);
employeeRoutes.get('/:id', ...requireAuth(), asyncHandler(controller.getEmployeeHandler));
employeeRoutes.patch(
  '/:id',
  ...requireAuth('employee:update'),
  validate(updateEmployeeSchema),
  asyncHandler(controller.updateEmployeeHandler),
);
employeeRoutes.delete('/:id', ...requireAuth('employee:delete'), asyncHandler(controller.deleteEmployeeHandler));
employeeRoutes.get('/:id/org-chart', ...requireAuth('employee:read'), asyncHandler(controller.getEmployeeOrgChartHandler));

// ---------------------------------------------------------------------------
// Nested sub-resources — read gated on employee:read, writes on employee:update
// ---------------------------------------------------------------------------

employeeRoutes.get('/:id/documents', ...requireAuth('employee:read'), asyncHandler(controller.listDocumentsHandler));
employeeRoutes.post(
  '/:id/documents',
  ...requireAuth('employee:update'),
  validate(employeeDocumentSchema),
  asyncHandler(controller.addDocumentHandler),
);
employeeRoutes.delete(
  '/:id/documents/:documentId',
  ...requireAuth('employee:update'),
  asyncHandler(controller.deleteDocumentHandler),
);

employeeRoutes.get(
  '/:id/emergency-contacts',
  ...requireAuth('employee:read'),
  asyncHandler(controller.listEmergencyContactsHandler),
);
employeeRoutes.post(
  '/:id/emergency-contacts',
  ...requireAuth('employee:update'),
  validate(emergencyContactSchema),
  asyncHandler(controller.addEmergencyContactHandler),
);
employeeRoutes.patch(
  '/:id/emergency-contacts/:contactId',
  ...requireAuth('employee:update'),
  validate(updateEmergencyContactSchema),
  asyncHandler(controller.updateEmergencyContactHandler),
);
employeeRoutes.delete(
  '/:id/emergency-contacts/:contactId',
  ...requireAuth('employee:update'),
  asyncHandler(controller.deleteEmergencyContactHandler),
);

employeeRoutes.get(
  '/:id/education',
  ...requireAuth('employee:read'),
  asyncHandler(controller.listEducationRecordsHandler),
);
employeeRoutes.post(
  '/:id/education',
  ...requireAuth('employee:update'),
  validate(educationRecordSchema),
  asyncHandler(controller.addEducationRecordHandler),
);
employeeRoutes.patch(
  '/:id/education/:recordId',
  ...requireAuth('employee:update'),
  validate(updateEducationRecordSchema),
  asyncHandler(controller.updateEducationRecordHandler),
);
employeeRoutes.delete(
  '/:id/education/:recordId',
  ...requireAuth('employee:update'),
  asyncHandler(controller.deleteEducationRecordHandler),
);

employeeRoutes.get(
  '/:id/experience',
  ...requireAuth('employee:read'),
  asyncHandler(controller.listExperienceRecordsHandler),
);
employeeRoutes.post(
  '/:id/experience',
  ...requireAuth('employee:update'),
  validate(experienceRecordSchema),
  asyncHandler(controller.addExperienceRecordHandler),
);
employeeRoutes.patch(
  '/:id/experience/:recordId',
  ...requireAuth('employee:update'),
  validate(updateExperienceRecordSchema),
  asyncHandler(controller.updateExperienceRecordHandler),
);
employeeRoutes.delete(
  '/:id/experience/:recordId',
  ...requireAuth('employee:update'),
  asyncHandler(controller.deleteExperienceRecordHandler),
);

employeeRoutes.get(
  '/:id/certifications',
  ...requireAuth('employee:read'),
  asyncHandler(controller.listCertificationsHandler),
);
employeeRoutes.post(
  '/:id/certifications',
  ...requireAuth('employee:update'),
  validate(certificationSchema),
  asyncHandler(controller.addCertificationHandler),
);
employeeRoutes.patch(
  '/:id/certifications/:certificationId',
  ...requireAuth('employee:update'),
  validate(updateCertificationSchema),
  asyncHandler(controller.updateCertificationHandler),
);
employeeRoutes.delete(
  '/:id/certifications/:certificationId',
  ...requireAuth('employee:update'),
  asyncHandler(controller.deleteCertificationHandler),
);

employeeRoutes.get('/:id/notes', ...requireAuth('employee:read'), asyncHandler(controller.listNotesHandler));
employeeRoutes.post(
  '/:id/notes',
  ...requireAuth('employee:update'),
  validate(employeeNoteSchema),
  asyncHandler(controller.addNoteHandler),
);
employeeRoutes.patch(
  '/:id/notes/:noteId',
  ...requireAuth('employee:update'),
  validate(updateEmployeeNoteSchema),
  asyncHandler(controller.updateNoteHandler),
);
employeeRoutes.delete('/:id/notes/:noteId', ...requireAuth('employee:update'), asyncHandler(controller.deleteNoteHandler));

employeeRoutes.get('/:id/skills', ...requireAuth('employee:read'), asyncHandler(controller.listEmployeeSkillsHandler));
employeeRoutes.post(
  '/:id/skills',
  ...requireAuth('employee:update'),
  validate(employeeSkillSchema),
  asyncHandler(controller.addEmployeeSkillHandler),
);
employeeRoutes.patch(
  '/:id/skills/:employeeSkillId',
  ...requireAuth('employee:update'),
  validate(updateEmployeeSkillSchema),
  asyncHandler(controller.updateEmployeeSkillHandler),
);
employeeRoutes.delete(
  '/:id/skills/:employeeSkillId',
  ...requireAuth('employee:update'),
  asyncHandler(controller.removeEmployeeSkillHandler),
);
