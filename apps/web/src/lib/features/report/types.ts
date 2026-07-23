export interface HeadcountByDepartment {
	departmentId: string | null;
	departmentName: string;
	count: number;
}

export interface AttendanceSummaryRow {
	status: string;
	count: number;
}

export interface LeaveSummaryRow {
	leaveTypeId: string;
	leaveTypeName: string;
	totalDays: string | number;
	requestCount: number;
}

export interface PayrollSummaryRow {
	month: number;
	grossEarnings: string | number;
	totalDeductions: string | number;
	netPay: string | number;
	payslipCount: number;
}
