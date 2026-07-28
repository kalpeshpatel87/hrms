export type TimesheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export interface Project {
	id: string;
	name: string;
	code: string;
	status: ProjectStatus;
	clientId: string | null;
	startDate: string | null;
	endDate: string | null;
}

export interface CreateProjectInput {
	name: string;
	code: string;
	clientId?: string;
	status?: ProjectStatus;
	startDate?: string;
	endDate?: string;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

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
