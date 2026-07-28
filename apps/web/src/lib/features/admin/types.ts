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

export interface CreateRoleInput {
	name: string;
	slug: string;
	description?: string | null;
}

export type UpdateRoleInput = Partial<Pick<CreateRoleInput, 'name' | 'description'>>;

export interface Company {
	id: string;
	name: string;
	legalName: string | null;
	cin: string | null;
	gstin: string | null;
	logoUrl: string | null;
	addressLine1: string | null;
	addressLine2: string | null;
	city: string | null;
	state: string | null;
	country: string | null;
	postalCode: string | null;
	timezone: string;
	defaultCurrency: string;
}

export type CompanyUpdateInput = Partial<
	Omit<Company, 'id' | 'timezone' | 'defaultCurrency'> & {
		timezone: string;
		defaultCurrency: string;
	}
>;

export interface AuditLogRow {
	id: string;
	actor: { id: string; email: string } | null;
	action: string;
	entityType: string;
	entityId: string;
	before: unknown;
	after: unknown;
	ipAddress: string | null;
	userAgent: string | null;
	createdAt: string;
}
