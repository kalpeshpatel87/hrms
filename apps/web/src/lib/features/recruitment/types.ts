export type JobOpeningStatus = 'DRAFT' | 'OPEN' | 'ON_HOLD' | 'CLOSED' | 'CANCELLED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | 'CONSULTANT';
export type CandidateStage =
	'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';

export interface JobOpening {
	id: string;
	title: string;
	employmentType: EmploymentType;
	numberOfPositions: number;
	status: JobOpeningStatus;
	_count?: { candidates: number };
}

export interface CreateJobOpeningInput {
	title: string;
	description?: string;
	employmentType?: EmploymentType;
	numberOfPositions?: number;
	status?: JobOpeningStatus;
}

export interface Candidate {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string | null;
	stage: CandidateStage;
	source: string | null;
}

export interface CreateCandidateInput {
	firstName: string;
	lastName: string;
	email: string;
	phone?: string;
	source?: string;
}
