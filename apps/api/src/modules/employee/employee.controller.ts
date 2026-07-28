import type { Request, Response } from 'express';
import { sendCreated, sendPaginated, sendSuccess } from '../../lib/response.js';
import * as employeeService from './employee.service.js';
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
  UpdateExperienceRecordInput,
  UpdateSkillCatalogInput,
  UpdateMyProfileInput,
  SetEmployeeRoleInput,
  ExperienceRecordInput,
} from './employee.validation.js';

// ---------------------------------------------------------------------------
// Employee
// ---------------------------------------------------------------------------

export async function listEmployeesHandler(req: Request, res: Response) {
  const query = req.query as unknown as EmployeeQuery;
  const result = await employeeService.listEmployees(query);
  return sendPaginated(res, result);
}

export async function createEmployeeHandler(req: Request, res: Response) {
  const body = req.body as CreateEmployeeInput;
  const employee = await employeeService.createEmployee(body);
  return sendCreated(res, employee, 'Employee created successfully');
}

export async function getMeHandler(req: Request, res: Response) {
  const employee = await employeeService.getMyEmployeeProfile(req.user!);
  return sendSuccess(res, employee);
}

export async function updateMyProfileHandler(req: Request, res: Response) {
  const body = req.body as UpdateMyProfileInput;
  const employee = await employeeService.updateMyProfile(req.user!.sub, body);
  return sendSuccess(res, employee, 'Profile updated successfully');
}

export async function getEmployeeHandler(req: Request, res: Response) {
  const employee = await employeeService.getEmployeeById(req.params.id as string, req.user!);
  return sendSuccess(res, employee);
}

export async function updateEmployeeHandler(req: Request, res: Response) {
  const body = req.body as UpdateEmployeeInput;
  const employee = await employeeService.updateEmployee(req.params.id as string, body);
  return sendSuccess(res, employee, 'Employee updated successfully');
}

export async function deleteEmployeeHandler(req: Request, res: Response) {
  await employeeService.deleteEmployee(req.params.id as string);
  return sendSuccess(res, null, 'Employee deleted successfully');
}

export async function reactivateEmployeeHandler(req: Request, res: Response) {
  const employee = await employeeService.reactivateEmployee(req.params.id as string);
  return sendSuccess(res, employee, 'Employee reactivated successfully');
}

export async function setEmployeeRoleHandler(req: Request, res: Response) {
  const body = req.body as SetEmployeeRoleInput;
  const result = await employeeService.setEmployeeRole(req.params.id as string, body.roleId);
  return sendSuccess(res, result, 'Role updated successfully');
}

// ---------------------------------------------------------------------------
// Org chart
// ---------------------------------------------------------------------------

export async function getOrgChartTreeHandler(_req: Request, res: Response) {
  const tree = await employeeService.getOrgChartTree();
  return sendSuccess(res, tree);
}

export async function getEmployeeOrgChartHandler(req: Request, res: Response) {
  const node = await employeeService.getEmployeeOrgChart(req.params.id as string);
  return sendSuccess(res, node);
}

// ---------------------------------------------------------------------------
// EmployeeDocument
// ---------------------------------------------------------------------------

export async function listDocumentsHandler(req: Request, res: Response) {
  const documents = await employeeService.listDocuments(req.params.id as string);
  return sendSuccess(res, documents);
}

export async function addDocumentHandler(req: Request, res: Response) {
  const body = req.body as EmployeeDocumentInput;
  const document = await employeeService.addDocument(req.params.id as string, body);
  return sendCreated(res, document);
}

export async function deleteDocumentHandler(req: Request, res: Response) {
  await employeeService.deleteDocument(req.params.id as string, req.params.documentId as string);
  return sendSuccess(res, null, 'Document deleted successfully');
}

// ---------------------------------------------------------------------------
// EmergencyContact
// ---------------------------------------------------------------------------

export async function listEmergencyContactsHandler(req: Request, res: Response) {
  const contacts = await employeeService.listEmergencyContacts(req.params.id as string);
  return sendSuccess(res, contacts);
}

export async function addEmergencyContactHandler(req: Request, res: Response) {
  const body = req.body as EmergencyContactInput;
  const contact = await employeeService.addEmergencyContact(req.params.id as string, body);
  return sendCreated(res, contact);
}

export async function updateEmergencyContactHandler(req: Request, res: Response) {
  const body = req.body as UpdateEmergencyContactInput;
  const contact = await employeeService.updateEmergencyContact(
    req.params.id as string,
    req.params.contactId as string,
    body,
  );
  return sendSuccess(res, contact, 'Emergency contact updated successfully');
}

export async function deleteEmergencyContactHandler(req: Request, res: Response) {
  await employeeService.deleteEmergencyContact(req.params.id as string, req.params.contactId as string);
  return sendSuccess(res, null, 'Emergency contact deleted successfully');
}

// ---------------------------------------------------------------------------
// EducationRecord
// ---------------------------------------------------------------------------

export async function listEducationRecordsHandler(req: Request, res: Response) {
  const records = await employeeService.listEducationRecords(req.params.id as string);
  return sendSuccess(res, records);
}

export async function addEducationRecordHandler(req: Request, res: Response) {
  const body = req.body as EducationRecordInput;
  const record = await employeeService.addEducationRecord(req.params.id as string, body);
  return sendCreated(res, record);
}

export async function updateEducationRecordHandler(req: Request, res: Response) {
  const body = req.body as UpdateEducationRecordInput;
  const record = await employeeService.updateEducationRecord(
    req.params.id as string,
    req.params.recordId as string,
    body,
  );
  return sendSuccess(res, record, 'Education record updated successfully');
}

export async function deleteEducationRecordHandler(req: Request, res: Response) {
  await employeeService.deleteEducationRecord(req.params.id as string, req.params.recordId as string);
  return sendSuccess(res, null, 'Education record deleted successfully');
}

// ---------------------------------------------------------------------------
// ExperienceRecord
// ---------------------------------------------------------------------------

export async function listExperienceRecordsHandler(req: Request, res: Response) {
  const records = await employeeService.listExperienceRecords(req.params.id as string);
  return sendSuccess(res, records);
}

export async function addExperienceRecordHandler(req: Request, res: Response) {
  const body = req.body as ExperienceRecordInput;
  const record = await employeeService.addExperienceRecord(req.params.id as string, body);
  return sendCreated(res, record);
}

export async function updateExperienceRecordHandler(req: Request, res: Response) {
  const body = req.body as UpdateExperienceRecordInput;
  const record = await employeeService.updateExperienceRecord(
    req.params.id as string,
    req.params.recordId as string,
    body,
  );
  return sendSuccess(res, record, 'Experience record updated successfully');
}

export async function deleteExperienceRecordHandler(req: Request, res: Response) {
  await employeeService.deleteExperienceRecord(req.params.id as string, req.params.recordId as string);
  return sendSuccess(res, null, 'Experience record deleted successfully');
}

// ---------------------------------------------------------------------------
// Certification
// ---------------------------------------------------------------------------

export async function listCertificationsHandler(req: Request, res: Response) {
  const records = await employeeService.listCertifications(req.params.id as string);
  return sendSuccess(res, records);
}

export async function addCertificationHandler(req: Request, res: Response) {
  const body = req.body as CertificationInput;
  const record = await employeeService.addCertification(req.params.id as string, body);
  return sendCreated(res, record);
}

export async function updateCertificationHandler(req: Request, res: Response) {
  const body = req.body as UpdateCertificationInput;
  const record = await employeeService.updateCertification(
    req.params.id as string,
    req.params.certificationId as string,
    body,
  );
  return sendSuccess(res, record, 'Certification updated successfully');
}

export async function deleteCertificationHandler(req: Request, res: Response) {
  await employeeService.deleteCertification(req.params.id as string, req.params.certificationId as string);
  return sendSuccess(res, null, 'Certification deleted successfully');
}

// ---------------------------------------------------------------------------
// EmployeeNote
// ---------------------------------------------------------------------------

export async function listNotesHandler(req: Request, res: Response) {
  const notes = await employeeService.listNotes(req.params.id as string, req.user!);
  return sendSuccess(res, notes);
}

export async function addNoteHandler(req: Request, res: Response) {
  const body = req.body as EmployeeNoteInput;
  const note = await employeeService.addNote(req.params.id as string, req.user!.sub, body);
  return sendCreated(res, note);
}

export async function updateNoteHandler(req: Request, res: Response) {
  const body = req.body as UpdateEmployeeNoteInput;
  const note = await employeeService.updateNote(req.params.id as string, req.params.noteId as string, body);
  return sendSuccess(res, note, 'Note updated successfully');
}

export async function deleteNoteHandler(req: Request, res: Response) {
  await employeeService.deleteNote(req.params.id as string, req.params.noteId as string);
  return sendSuccess(res, null, 'Note deleted successfully');
}

// ---------------------------------------------------------------------------
// Skill catalog
// ---------------------------------------------------------------------------

export async function listSkillsCatalogHandler(req: Request, res: Response) {
  const query = req.query as unknown as SkillQuery;
  const result = await employeeService.listSkillsCatalog(query);
  return sendPaginated(res, result);
}

export async function createSkillCatalogEntryHandler(req: Request, res: Response) {
  const body = req.body as SkillCatalogInput;
  const skill = await employeeService.createSkillCatalogEntry(body);
  return sendCreated(res, skill);
}

export async function updateSkillCatalogEntryHandler(req: Request, res: Response) {
  const body = req.body as UpdateSkillCatalogInput;
  const skill = await employeeService.updateSkillCatalogEntry(req.params.id as string, body);
  return sendSuccess(res, skill, 'Skill updated successfully');
}

export async function deleteSkillCatalogEntryHandler(req: Request, res: Response) {
  await employeeService.deleteSkillCatalogEntry(req.params.id as string);
  return sendSuccess(res, null, 'Skill deleted successfully');
}

// ---------------------------------------------------------------------------
// EmployeeSkill (assignment)
// ---------------------------------------------------------------------------

export async function listEmployeeSkillsHandler(req: Request, res: Response) {
  const skills = await employeeService.listEmployeeSkills(req.params.id as string);
  return sendSuccess(res, skills);
}

export async function addEmployeeSkillHandler(req: Request, res: Response) {
  const body = req.body as EmployeeSkillInput;
  const skill = await employeeService.addEmployeeSkill(req.params.id as string, body);
  return sendCreated(res, skill);
}

export async function updateEmployeeSkillHandler(req: Request, res: Response) {
  const body = req.body as UpdateEmployeeSkillInput;
  const skill = await employeeService.updateEmployeeSkill(
    req.params.id as string,
    req.params.employeeSkillId as string,
    body,
  );
  return sendSuccess(res, skill, 'Skill assignment updated successfully');
}

export async function removeEmployeeSkillHandler(req: Request, res: Response) {
  await employeeService.removeEmployeeSkill(req.params.id as string, req.params.employeeSkillId as string);
  return sendSuccess(res, null, 'Skill removed successfully');
}
