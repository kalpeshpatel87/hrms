import { apiClient } from '../../services/api-client.js';
import type { OnboardingChecklist } from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function getChecklistForEmployee(employeeId: string): Promise<OnboardingChecklist> {
	const res = await apiClient.get<ApiEnvelope<OnboardingChecklist>>(
		`/onboarding/checklists/${employeeId}`
	);
	return res.data.data;
}
