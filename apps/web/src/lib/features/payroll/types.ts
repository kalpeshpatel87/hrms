export interface Payslip {
	id: string;
	month: number;
	year: number;
	grossEarnings: string;
	totalDeductions: string;
	netPay: string;
	paidDays: string;
	lopDays: string;
	currency: string;
	generatedAt: string;
}

export type PayrollRunStatus =
	'DRAFT' | 'PROCESSING' | 'PENDING_APPROVAL' | 'APPROVED' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface PayrollRun {
	id: string;
	month: number;
	year: number;
	status: PayrollRunStatus;
	totalGross: string | null;
	totalDeductions: string | null;
	totalNet: string | null;
	employeeCount: number | null;
	processedAt: string | null;
}
