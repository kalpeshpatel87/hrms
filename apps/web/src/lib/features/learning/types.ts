export type EnrollmentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface Course {
	id: string;
	title: string;
	description: string | null;
	durationMinutes: number | null;
	provider: string | null;
	isMandatory: boolean;
}

export interface Enrollment {
	id: string;
	status: EnrollmentStatus;
	enrolledAt: string;
	completedAt: string | null;
	score: string | null;
	course: Course;
}
