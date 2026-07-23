export type TimesheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface Project {
	id: string;
	name: string;
	code: string;
}

export interface TimesheetEntry {
	id?: string;
	projectId: string;
	date: string;
	hours: number;
	isBillable?: boolean;
	description?: string;
	project?: Project;
}

export interface Timesheet {
	id: string;
	weekStartDate: string;
	status: TimesheetStatus;
	entries: TimesheetEntry[];
}

export interface CreateTimesheetInput {
	weekStartDate: string;
	entries: TimesheetEntry[];
}
