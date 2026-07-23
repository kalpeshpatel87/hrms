export type OnboardingTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export interface OnboardingTask {
	id: string;
	taskName: string;
	status: OnboardingTaskStatus;
	dueDate: string | null;
	completedAt: string | null;
}

export interface OnboardingChecklist {
	id: string;
	templateName: string;
	startedAt: string;
	completedAt: string | null;
	tasks: OnboardingTask[];
}
