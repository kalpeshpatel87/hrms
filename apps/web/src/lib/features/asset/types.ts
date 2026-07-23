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
