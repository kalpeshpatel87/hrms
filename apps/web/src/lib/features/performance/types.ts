export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DEFERRED' | 'CANCELLED';

export interface KeyResult {
	id: string;
	description: string;
	targetValue: string | null;
	actualValue: string | null;
	unit: string | null;
}

export interface Goal {
	id: string;
	title: string;
	description: string | null;
	startDate: string;
	dueDate: string;
	weightPercent: string;
	status: GoalStatus;
	progressPercent: number;
	keyResults: KeyResult[];
}

export interface CreateGoalInput {
	title: string;
	description?: string;
	startDate: string;
	dueDate: string;
	weightPercent?: number;
}

export interface UpdateGoalInput {
	status?: GoalStatus;
	progressPercent?: number;
}
