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
