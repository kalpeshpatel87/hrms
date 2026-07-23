import { getMyAttendance } from '../attendance/api.js';
import { listAnnouncements } from '../announcement/api.js';
import { getMyLeaveBalances } from '../leave/api.js';

export async function loadDashboardData() {
	const now = new Date();
	const [announcements, leaveBalances, attendance] = await Promise.all([
		listAnnouncements({ page: 1, pageSize: 5 }),
		getMyLeaveBalances(now.getFullYear()),
		getMyAttendance(now.getMonth() + 1, now.getFullYear())
	]);

	return { announcements, leaveBalances, attendance };
}
