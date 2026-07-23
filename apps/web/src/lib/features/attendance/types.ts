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
