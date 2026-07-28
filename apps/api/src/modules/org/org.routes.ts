import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './org.controller.js';
import {
  auditLogQuerySchema,
  branchCreateSchema,
  branchQuerySchema,
  branchUpdateSchema,
  companySettingKeyParamSchema,
  companySettingQuerySchema,
  companySettingUpsertSchema,
  companyUpdateSchema,
  departmentCreateSchema,
  departmentQuerySchema,
  departmentUpdateSchema,
  designationCreateSchema,
  designationQuerySchema,
  designationUpdateSchema,
  holidayCreateSchema,
  holidayQuerySchema,
  holidayUpdateSchema,
  idParamSchema,
  shiftCreateSchema,
  shiftQuerySchema,
  shiftUpdateSchema,
  teamCreateSchema,
  teamQuerySchema,
  teamUpdateSchema,
} from './org.validation.js';
import { rbacRoutes } from './rbac.routes.js';

/**
 * Top-level router for the "org" module. Mounted once by the integrator at
 * /org. Covers department/designation/branch/team/shift/holiday/company plus
 * the nested role/permission (RBAC) sub-router.
 */
export const orgRoutes = Router();

// ---------------------------------------------------------------------------
// Department
// ---------------------------------------------------------------------------

orgRoutes.get(
  '/departments',
  ...requireAuth('department:read'),
  validate(departmentQuerySchema, 'query'),
  asyncHandler(controller.listDepartmentsHandler),
);
orgRoutes.get(
  '/departments/:id',
  ...requireAuth('department:read'),
  validate(idParamSchema, 'params'),
  asyncHandler(controller.getDepartmentHandler),
);
orgRoutes.post(
  '/departments',
  ...requireAuth('department:create'),
  validate(departmentCreateSchema),
  asyncHandler(controller.createDepartmentHandler),
);
orgRoutes.put(
  '/departments/:id',
  ...requireAuth('department:update'),
  validate(idParamSchema, 'params'),
  validate(departmentUpdateSchema),
  asyncHandler(controller.updateDepartmentHandler),
);
orgRoutes.delete(
  '/departments/:id',
  ...requireAuth('department:delete'),
  validate(idParamSchema, 'params'),
  asyncHandler(controller.deleteDepartmentHandler),
);

// ---------------------------------------------------------------------------
// Designation
// ---------------------------------------------------------------------------

orgRoutes.get(
  '/designations',
  ...requireAuth('designation:read'),
  validate(designationQuerySchema, 'query'),
  asyncHandler(controller.listDesignationsHandler),
);
orgRoutes.get(
  '/designations/:id',
  ...requireAuth('designation:read'),
  validate(idParamSchema, 'params'),
  asyncHandler(controller.getDesignationHandler),
);
orgRoutes.post(
  '/designations',
  ...requireAuth('designation:create'),
  validate(designationCreateSchema),
  asyncHandler(controller.createDesignationHandler),
);
orgRoutes.put(
  '/designations/:id',
  ...requireAuth('designation:update'),
  validate(idParamSchema, 'params'),
  validate(designationUpdateSchema),
  asyncHandler(controller.updateDesignationHandler),
);
orgRoutes.delete(
  '/designations/:id',
  ...requireAuth('designation:delete'),
  validate(idParamSchema, 'params'),
  asyncHandler(controller.deleteDesignationHandler),
);

// ---------------------------------------------------------------------------
// Branch
// ---------------------------------------------------------------------------

orgRoutes.get(
  '/branches',
  ...requireAuth('branch:read'),
  validate(branchQuerySchema, 'query'),
  asyncHandler(controller.listBranchesHandler),
);
orgRoutes.get(
  '/branches/:id',
  ...requireAuth('branch:read'),
  validate(idParamSchema, 'params'),
  asyncHandler(controller.getBranchHandler),
);
orgRoutes.post(
  '/branches',
  ...requireAuth('branch:create'),
  validate(branchCreateSchema),
  asyncHandler(controller.createBranchHandler),
);
orgRoutes.put(
  '/branches/:id',
  ...requireAuth('branch:update'),
  validate(idParamSchema, 'params'),
  validate(branchUpdateSchema),
  asyncHandler(controller.updateBranchHandler),
);
orgRoutes.delete(
  '/branches/:id',
  ...requireAuth('branch:delete'),
  validate(idParamSchema, 'params'),
  asyncHandler(controller.deleteBranchHandler),
);

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

orgRoutes.get(
  '/teams',
  ...requireAuth('team:read'),
  validate(teamQuerySchema, 'query'),
  asyncHandler(controller.listTeamsHandler),
);
orgRoutes.get(
  '/teams/:id',
  ...requireAuth('team:read'),
  validate(idParamSchema, 'params'),
  asyncHandler(controller.getTeamHandler),
);
orgRoutes.post(
  '/teams',
  ...requireAuth('team:create'),
  validate(teamCreateSchema),
  asyncHandler(controller.createTeamHandler),
);
orgRoutes.put(
  '/teams/:id',
  ...requireAuth('team:update'),
  validate(idParamSchema, 'params'),
  validate(teamUpdateSchema),
  asyncHandler(controller.updateTeamHandler),
);
orgRoutes.delete(
  '/teams/:id',
  ...requireAuth('team:delete'),
  validate(idParamSchema, 'params'),
  asyncHandler(controller.deleteTeamHandler),
);

// ---------------------------------------------------------------------------
// Shift
// ---------------------------------------------------------------------------

orgRoutes.get(
  '/shifts',
  ...requireAuth('shift:read'),
  validate(shiftQuerySchema, 'query'),
  asyncHandler(controller.listShiftsHandler),
);
orgRoutes.get(
  '/shifts/:id',
  ...requireAuth('shift:read'),
  validate(idParamSchema, 'params'),
  asyncHandler(controller.getShiftHandler),
);
orgRoutes.post(
  '/shifts',
  ...requireAuth('shift:create'),
  validate(shiftCreateSchema),
  asyncHandler(controller.createShiftHandler),
);
orgRoutes.put(
  '/shifts/:id',
  ...requireAuth('shift:update'),
  validate(idParamSchema, 'params'),
  validate(shiftUpdateSchema),
  asyncHandler(controller.updateShiftHandler),
);
orgRoutes.delete(
  '/shifts/:id',
  ...requireAuth('shift:delete'),
  validate(idParamSchema, 'params'),
  asyncHandler(controller.deleteShiftHandler),
);

// ---------------------------------------------------------------------------
// Holiday
// ---------------------------------------------------------------------------

// Self-service: any authenticated employee may view the holiday calendar (see
// EMPLOYEE_SELF_SERVICE seed — holiday:read is granted to the Employee role).
orgRoutes.get(
  '/holidays',
  ...requireAuth('holiday:read'),
  validate(holidayQuerySchema, 'query'),
  asyncHandler(controller.listHolidaysHandler),
);
orgRoutes.get(
  '/holidays/:id',
  ...requireAuth('holiday:read'),
  validate(idParamSchema, 'params'),
  asyncHandler(controller.getHolidayHandler),
);
orgRoutes.post(
  '/holidays',
  ...requireAuth('holiday:create'),
  validate(holidayCreateSchema),
  asyncHandler(controller.createHolidayHandler),
);
orgRoutes.put(
  '/holidays/:id',
  ...requireAuth('holiday:update'),
  validate(idParamSchema, 'params'),
  validate(holidayUpdateSchema),
  asyncHandler(controller.updateHolidayHandler),
);
orgRoutes.delete(
  '/holidays/:id',
  ...requireAuth('holiday:delete'),
  validate(idParamSchema, 'params'),
  asyncHandler(controller.deleteHolidayHandler),
);

// ---------------------------------------------------------------------------
// Company (singleton) + CompanySetting (key/value)
// ---------------------------------------------------------------------------

orgRoutes.get('/company', ...requireAuth('company_setting:read'), asyncHandler(controller.getCompanyHandler));
orgRoutes.put(
  '/company',
  ...requireAuth('company_setting:update'),
  validate(companyUpdateSchema),
  asyncHandler(controller.updateCompanyHandler),
);

orgRoutes.get(
  '/company-settings',
  ...requireAuth('company_setting:read'),
  validate(companySettingQuerySchema, 'query'),
  asyncHandler(controller.listCompanySettingsHandler),
);
orgRoutes.get(
  '/company-settings/:key',
  ...requireAuth('company_setting:read'),
  validate(companySettingKeyParamSchema, 'params'),
  asyncHandler(controller.getCompanySettingHandler),
);
orgRoutes.put(
  '/company-settings/:key',
  ...requireAuth('company_setting:update'),
  validate(companySettingKeyParamSchema, 'params'),
  validate(companySettingUpsertSchema),
  asyncHandler(controller.upsertCompanySettingHandler),
);

// ---------------------------------------------------------------------------
// AuditLog (read-only)
// ---------------------------------------------------------------------------

orgRoutes.get(
  '/audit-logs',
  ...requireAuth('audit_log:read'),
  validate(auditLogQuerySchema, 'query'),
  asyncHandler(controller.listAuditLogsHandler),
);

// ---------------------------------------------------------------------------
// RBAC (Role + Permission) — nested sub-router
// ---------------------------------------------------------------------------

orgRoutes.use(rbacRoutes);
