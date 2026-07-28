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
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
export type BloodGroup =
	| 'A_POSITIVE'
	| 'A_NEGATIVE'
	| 'B_POSITIVE'
	| 'B_NEGATIVE'
	| 'AB_POSITIVE'
	| 'AB_NEGATIVE'
	| 'O_POSITIVE'
	| 'O_NEGATIVE';

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
	user: {
		id: string;
		email: string;
		isActive: boolean;
		mustChangePassword: boolean;
		userRoles?: { role: { id: string; name: string; slug: string } }[];
	};
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
	/** Defaults to the system "employee" role when omitted. Super Admin only. */
	roleId?: string;
	dateOfBirth?: string;
	gender?: Gender;
	maritalStatus?: MaritalStatus;
	bloodGroup?: BloodGroup;
	nationality?: string;
	addressLine1?: string;
	addressLine2?: string;
	city?: string;
	state?: string;
	country?: string;
	postalCode?: string;
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
	activeFilter?: 'active' | 'inactive' | 'all';
}
