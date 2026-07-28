export type AttendanceStatus =
	| 'PRESENT'
	| 'ABSENT'
	| 'HALF_DAY'
	| 'ON_LEAVE'
	| 'HOLIDAY'
	| 'WEEK_OFF'
	| 'LATE'
	| 'WORK_FROM_HOME';

export interface AttendanceRecord {
	id: string;
	date: string;
	checkInAt: string | null;
	checkOutAt: string | null;
	totalWorkMinutes: number | null;
	totalBreakMinutes: number | null;
	status: AttendanceStatus;
	isRegularized: boolean;
}

export interface AttendanceListItem extends AttendanceRecord {
	employee: {
		id: string;
		employeeCode: string;
		firstName: string;
		lastName: string;
		departmentId: string | null;
	};
}

export interface AttendanceQueryParams {
	page?: number;
	pageSize?: number;
	search?: string;
	sortBy?: string;
	sortDir?: 'asc' | 'desc';
	employeeId?: string;
	departmentId?: string;
	status?: AttendanceStatus;
	dateFrom?: string;
	dateTo?: string;
}

export interface UpdateAttendanceInput {
	checkInAt?: string;
	checkOutAt?: string;
	status?: AttendanceStatus;
	remarks?: string;
	isRegularized?: boolean;
}

export type CorrectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CorrectionRequest {
	id: string;
	employee: { id: string; employeeCode: string; firstName: string; lastName: string };
	attendanceRecord: AttendanceRecord;
	requestedCheckInAt: string | null;
	requestedCheckOutAt: string | null;
	reason: string;
	status: CorrectionStatus;
	createdAt: string;
}
