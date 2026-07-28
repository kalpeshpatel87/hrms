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

export interface MyProfile {
	id: string;
	employeeCode: string;
	firstName: string;
	lastName: string;
	displayName: string | null;
	personalEmail: string | null;
	phone: string | null;
	alternatePhone: string | null;
	dateOfBirth: string | null;
	gender: Gender | null;
	maritalStatus: MaritalStatus | null;
	bloodGroup: BloodGroup | null;
	nationality: string | null;
	photoUrl: string | null;
	addressLine1: string | null;
	addressLine2: string | null;
	city: string | null;
	state: string | null;
	country: string | null;
	postalCode: string | null;
	dateOfJoining: string;
	status: string;
	department: { id: string; name: string; code: string } | null;
	designation: { id: string; title: string } | null;
	branch: { id: string; name: string; code: string } | null;
	user: { id: string; email: string; isActive: boolean; mustChangePassword: boolean };
}

export interface UpdateMyProfileInput {
	personalEmail?: string;
	phone?: string;
	alternatePhone?: string;
	dateOfBirth?: string;
	gender?: Gender;
	maritalStatus?: MaritalStatus;
	bloodGroup?: BloodGroup;
	nationality?: string;
	photoUrl?: string;
	addressLine1?: string;
	addressLine2?: string;
	city?: string;
	state?: string;
	country?: string;
	postalCode?: string;
}
