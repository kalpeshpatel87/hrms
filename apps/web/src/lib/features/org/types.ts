export interface Department {
	id: string;
	name: string;
	code: string;
	parentDepartmentId: string | null;
}

export interface Designation {
	id: string;
	title: string;
	level: number | null;
}

export interface Branch {
	id: string;
	name: string;
	code: string;
}
