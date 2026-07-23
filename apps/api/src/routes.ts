import { Router } from 'express';
import { announcementRoutes } from './modules/announcement/announcement.routes.js';
import { attendanceRoutes } from './modules/attendance/attendance.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { employeeRoutes } from './modules/employee/employee.routes.js';
import { leaveRoutes } from './modules/leave/leave.routes.js';
import { orgRoutes } from './modules/org/org.routes.js';
import { payrollRoutes } from './modules/payroll/payroll.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/org', orgRoutes);
apiRouter.use('/employees', employeeRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/leave', leaveRoutes);
apiRouter.use('/payroll', payrollRoutes);
apiRouter.use('/announcements', announcementRoutes);

/**
 * Further module routers (scaffolded tier: performance, timesheets, assets,
 * exit, recruitment, onboarding, helpdesk, learning, expenses, travel,
 * documents, notifications) are mounted here as each is built.
 */
