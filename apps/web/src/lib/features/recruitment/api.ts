import type { PaginatedResult } from '@atyantik/shared-types';
import { apiClient } from '../../services/api-client.js';
import type {
	Candidate,
	CandidateStage,
	CreateCandidateInput,
	CreateJobOpeningInput,
	JobOpening
} from './types.js';

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
}

export async function listJobOpenings(params: {
	page?: number;
	pageSize?: number;
}): Promise<PaginatedResult<JobOpening>> {
	const res = await apiClient.get<ApiEnvelope<PaginatedResult<JobOpening>>>(
		'/recruitment/job-openings',
		{ params }
	);
	return res.data.data;
}

export async function createJobOpening(input: CreateJobOpeningInput): Promise<JobOpening> {
	const res = await apiClient.post<ApiEnvelope<JobOpening>>('/recruitment/job-openings', input);
	return res.data.data;
}

export async function listCandidates(jobOpeningId: string): Promise<Candidate[]> {
	const res = await apiClient.get<ApiEnvelope<Candidate[]>>(
		`/recruitment/job-openings/${jobOpeningId}/candidates`
	);
	return res.data.data;
}

export async function addCandidate(
	jobOpeningId: string,
	input: CreateCandidateInput
): Promise<Candidate> {
	const res = await apiClient.post<ApiEnvelope<Candidate>>(
		`/recruitment/job-openings/${jobOpeningId}/candidates`,
		input
	);
	return res.data.data;
}

export async function updateCandidateStage(
	candidateId: string,
	stage: CandidateStage
): Promise<Candidate> {
	const res = await apiClient.patch<ApiEnvelope<Candidate>>(
		`/recruitment/candidates/${candidateId}/stage`,
		{
			stage
		}
	);
	return res.data.data;
}
