export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | 'CONSULTANT';
export type EmployeeStatus =
	| 'PROBATION'
	| 'ACTIVE'
	| 'ON_LEAVE'
	| 'SUSPENDED'
	| 'NOTICE_PERIOD'
	| 'RESIGNED'
	| 'TERMINATED'
	| 'ABSCONDED';

export interface EmployeeListItem {
	id: string;
	employeeCode: string;
	firstName: string;
	lastName: string;
	displayName: string | null;
	photoUrl: string | null;
	employmentType: EmploymentType;
	status: EmployeeStatus;
	dateOfJoining: string;
	department: { id: string; name: string; code: string } | null;
	designation: { id: string; title: string } | null;
	branch: { id: string; name: string; code: string } | null;
	team: { id: string; name: string } | null;
	reportingManager: {
		id: string;
		firstName: string;
		lastName: string;
		employeeCode: string;
	} | null;
	user: { id: string; email: string; isActive: boolean; mustChangePassword: boolean };
}

export interface CreateEmployeeInput {
	email: string;
	firstName: string;
	lastName: string;
	middleName?: string;
	personalEmail?: string;
	phone?: string;
	dateOfJoining: string;
	employmentType?: EmploymentType;
	status?: EmployeeStatus;
	departmentId?: string;
	designationId?: string;
	branchId?: string;
	teamId?: string;
	shiftId?: string;
	reportingManagerId?: string;
}

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

export interface EmployeeQueryParams {
	page?: number;
	pageSize?: number;
	search?: string;
	sortBy?: string;
	sortDir?: 'asc' | 'desc';
	departmentId?: string;
	status?: EmployeeStatus;
	employmentType?: EmploymentType;
}
