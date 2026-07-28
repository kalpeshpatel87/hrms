export type AssetCategory =
	| 'LAPTOP'
	| 'DESKTOP'
	| 'MONITOR'
	| 'MOBILE'
	| 'PERIPHERAL'
	| 'FURNITURE'
	| 'SOFTWARE_LICENSE'
	| 'VEHICLE'
	| 'OTHER';
export type AssetCondition = 'NEW' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';
export type AssetStatus = 'AVAILABLE' | 'ASSIGNED' | 'IN_REPAIR' | 'RETIRED' | 'LOST';

export interface Asset {
	id: string;
	assetCode: string;
	name: string;
	category: AssetCategory;
	brand: string | null;
	model: string | null;
	condition: AssetCondition;
}

export interface AssetAssignment {
	id: string;
	assignedAt: string;
	returnedAt: string | null;
	conditionAtAssign: AssetCondition | null;
	asset: Asset;
}

export interface AssetRow extends Asset {
	serialNumber: string | null;
	status: AssetStatus;
	notes: string | null;
	assignments: Array<{
		id: string;
		assignedAt: string;
		employee: { id: string; firstName: string; lastName: string; employeeCode: string };
	}>;
}

export interface CreateAssetInput {
	assetCode: string;
	name: string;
	category: AssetCategory;
	brand?: string;
	model?: string;
	serialNumber?: string;
	condition?: AssetCondition;
	notes?: string;
}

export interface AssignAssetInput {
	employeeId: string;
	conditionAtAssign?: AssetCondition;
	remarks?: string;
}
