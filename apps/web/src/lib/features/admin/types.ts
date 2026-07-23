export interface DepartmentRow {
	id: string;
	name: string;
	code: string;
	parentDepartmentId: string | null;
	headEmployee: { id: string; firstName: string; lastName: string } | null;
	_count?: { subDepartments: number; employees: number };
}

export interface CreateDepartmentInput {
	name: string;
	code: string;
	parentDepartmentId?: string;
	headEmployeeId?: string;
}

export interface Permission {
	id: string;
	module: string;
	action: string;
	key: string;
	description: string | null;
}

export interface Role {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	isSystem: boolean;
	rolePermissions?: { permission: Permission }[];
}
