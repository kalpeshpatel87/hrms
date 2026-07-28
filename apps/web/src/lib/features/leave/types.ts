export interface LeaveBalance {
	id: string;
	year: number;
	allocated: string;
	used: string;
	carriedForward: string;
	adjusted: string;
	available: string;
	leaveType: { id: string; name: string; code: string };
}

export type LeaveUnit = 'FULL_DAY' | 'HALF_DAY_FIRST' | 'HALF_DAY_SECOND';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WITHDRAWN';

export interface LeaveType {
	id: string;
	name: string;
	code: string;
	isPaid: boolean;
	requiresApproval: boolean;
}

export interface LeaveRequest {
	id: string;
	startDate: string;
	endDate: string;
	startDayUnit: LeaveUnit;
	endDayUnit: LeaveUnit;
	totalDays: string;
	reason: string | null;
	status: LeaveStatus;
	appliedAt: string;
	leaveType: { id: string; name: string; code: string };
	employee?: { id: string; firstName: string; lastName: string; employeeCode: string };
}

export interface LeaveApproval {
	id: string;
	sequence: number;
	status: string;
	comments: string | null;
	leaveRequest: LeaveRequest & {
		employee: { id: string; firstName: string; lastName: string; employeeCode: string };
	};
}

export interface CreateLeaveRequestInput {
	leaveTypeId: string;
	startDate: string;
	endDate: string;
	startDayUnit?: LeaveUnit;
	endDayUnit?: LeaveUnit;
	reason?: string;
}

export interface CreateLeaveRequestAdminInput extends CreateLeaveRequestInput {
	employeeId: string;
}
