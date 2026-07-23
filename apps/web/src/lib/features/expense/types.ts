export type ExpenseCategory =
	'TRAVEL' | 'FOOD' | 'ACCOMMODATION' | 'OFFICE_SUPPLIES' | 'CLIENT_ENTERTAINMENT' | 'OTHER';
export type ExpenseStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REIMBURSED';

export interface ExpenseItem {
	id: string;
	category: ExpenseCategory;
	amount: string;
	expenseDate: string;
	description: string | null;
}

export interface ExpenseClaim {
	id: string;
	title: string;
	totalAmount: string;
	currency: string;
	status: ExpenseStatus;
	submittedAt: string | null;
	createdAt: string;
	items: ExpenseItem[];
}

export interface ExpenseItemInput {
	category: ExpenseCategory;
	amount: number;
	expenseDate: string;
	description?: string;
}

export interface CreateExpenseClaimInput {
	title: string;
	currency?: string;
	items: ExpenseItemInput[];
}
