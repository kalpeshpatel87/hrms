export type TravelStatus =
	'PENDING' | 'APPROVED' | 'REJECTED' | 'BOOKED' | 'COMPLETED' | 'CANCELLED';

export interface TravelRequest {
	id: string;
	purpose: string;
	origin: string;
	destination: string;
	startDate: string;
	endDate: string;
	estimatedCost: string | null;
	status: TravelStatus;
	createdAt: string;
}

export interface CreateTravelRequestInput {
	purpose: string;
	origin: string;
	destination: string;
	startDate: string;
	endDate: string;
	estimatedCost?: number;
}
