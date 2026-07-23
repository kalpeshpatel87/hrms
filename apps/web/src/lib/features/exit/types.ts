export type ResignationStatus =
	'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'NOTICE_PERIOD' | 'RELIEVED';
export type ExitTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export interface ExitChecklistTask {
	id: string;
	taskName: string;
	status: ExitTaskStatus;
	dueDate: string | null;
}

export interface ExitChecklist {
	id: string;
	tasks: ExitChecklistTask[];
}

export interface Resignation {
	id: string;
	resignationDate: string;
	lastWorkingDate: string;
	reason: string | null;
	status: ResignationStatus;
	createdAt: string;
	exitChecklist: ExitChecklist | null;
}

export interface CreateResignationInput {
	resignationDate: string;
	lastWorkingDate: string;
	reason?: string;
}
