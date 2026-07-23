export type NotificationType =
	| 'SYSTEM'
	| 'LEAVE'
	| 'ATTENDANCE'
	| 'PAYROLL'
	| 'ANNOUNCEMENT'
	| 'TICKET'
	| 'PERFORMANCE'
	| 'RECRUITMENT'
	| 'ASSET'
	| 'EXPENSE'
	| 'TRAVEL'
	| 'ONBOARDING'
	| 'EXIT'
	| 'GENERIC';

export interface Notification {
	id: string;
	type: NotificationType;
	title: string;
	body: string | null;
	isRead: boolean;
	readAt: string | null;
	createdAt: string;
}
