import { Router } from 'express';
import { announcementRoutes } from './modules/announcement/announcement.routes.js';
import { assetRoutes } from './modules/asset/asset.routes.js';
import { attendanceRoutes } from './modules/attendance/attendance.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { documentRoutes } from './modules/document/document.routes.js';
import { employeeRoutes } from './modules/employee/employee.routes.js';
import { exitRoutes } from './modules/exit/exit.routes.js';
import { expenseRoutes } from './modules/expense/expense.routes.js';
import { helpdeskRoutes } from './modules/helpdesk/helpdesk.routes.js';
import { leaveRoutes } from './modules/leave/leave.routes.js';
import { learningRoutes } from './modules/learning/learning.routes.js';
import { notificationRoutes } from './modules/notification/notification.routes.js';
import { onboardingRoutes } from './modules/onboarding/onboarding.routes.js';
import { orgRoutes } from './modules/org/org.routes.js';
import { payrollRoutes } from './modules/payroll/payroll.routes.js';
import { performanceRoutes } from './modules/performance/performance.routes.js';
import { recruitmentRoutes } from './modules/recruitment/recruitment.routes.js';
import { timesheetRoutes } from './modules/timesheet/timesheet.routes.js';
import { travelRoutes } from './modules/travel/travel.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Deep modules
apiRouter.use('/auth', authRoutes);
apiRouter.use('/org', orgRoutes);
apiRouter.use('/employees', employeeRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/leave', leaveRoutes);
apiRouter.use('/payroll', payrollRoutes);
apiRouter.use('/announcements', announcementRoutes);

// Scaffolded modules
apiRouter.use('/performance', performanceRoutes);
apiRouter.use('/timesheets', timesheetRoutes);
apiRouter.use('/assets', assetRoutes);
apiRouter.use('/exit', exitRoutes);
apiRouter.use('/recruitment', recruitmentRoutes);
apiRouter.use('/onboarding', onboardingRoutes);
apiRouter.use('/helpdesk', helpdeskRoutes);
apiRouter.use('/learning', learningRoutes);
apiRouter.use('/expenses', expenseRoutes);
apiRouter.use('/travel', travelRoutes);
apiRouter.use('/documents', documentRoutes);
apiRouter.use('/notifications', notificationRoutes);
