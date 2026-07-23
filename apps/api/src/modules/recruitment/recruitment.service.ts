import type { CandidateStage, Prisma } from '@prisma/client';
import { prisma, softDelete } from '../../db/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { recordAuditLog } from '../../lib/auditLog.js';
import { buildPagination } from '../../lib/response.js';
import type {
  AddPanelistInput,
  CandidateInput,
  CreateInterviewInput,
  CreateOfferInput,
  JobOpeningInput,
  JobOpeningQuery,
  PanelistFeedbackInput,
  RespondOfferInput,
  UpdateJobOpeningInput,
} from './recruitment.validation.js';

// ---------------------------------------------------------------------------
// JobOpening
// ---------------------------------------------------------------------------

async function resolveCompanyId(): Promise<string> {
  const company = await prisma.company.findFirst({ select: { id: true } });
  if (!company) throw ApiError.badRequest('No company record exists yet');
  return company.id;
}

export async function listJobOpenings(query: JobOpeningQuery) {
  const where: Prisma.JobOpeningWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.search) where.title = { contains: query.search, mode: 'insensitive' };

  const [items, total] = await Promise.all([
    prisma.jobOpening.findMany({
      where,
      include: { _count: { select: { candidates: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.jobOpening.count({ where }),
  ]);
  return { items, ...buildPagination(total, query.page, query.pageSize) };
}

export async function createJobOpening(input: JobOpeningInput) {
  const companyId = await resolveCompanyId();
  const jobOpening = await prisma.jobOpening.create({ data: { ...input, companyId } });
  await recordAuditLog({ action: 'CREATE', entityType: 'JobOpening', entityId: jobOpening.id, after: jobOpening });
  return jobOpening;
}

export async function updateJobOpening(id: string, input: UpdateJobOpeningInput) {
  const before = await prisma.jobOpening.findUnique({ where: { id } });
  if (!before) throw ApiError.notFound('Job opening not found');
  const updated = await prisma.jobOpening.update({ where: { id }, data: input });
  await recordAuditLog({ action: 'UPDATE', entityType: 'JobOpening', entityId: id, before, after: updated });
  return updated;
}

// ---------------------------------------------------------------------------
// Candidate
// ---------------------------------------------------------------------------

const candidateInclude = {
  interviews: { include: { panelists: true } },
  offer: true,
} satisfies Prisma.CandidateInclude;

export async function addCandidate(jobOpeningId: string, input: CandidateInput) {
  const jobOpening = await prisma.jobOpening.findUnique({ where: { id: jobOpeningId } });
  if (!jobOpening) throw ApiError.notFound('Job opening not found');

  const candidate = await prisma.candidate.create({ data: { ...input, jobOpeningId }, include: candidateInclude });
  await recordAuditLog({ action: 'CREATE', entityType: 'Candidate', entityId: candidate.id, after: candidate });
  return candidate;
}

export async function listCandidates(jobOpeningId: string) {
  return prisma.candidate.findMany({ where: { jobOpeningId }, include: candidateInclude, orderBy: { createdAt: 'desc' } });
}

export async function updateCandidateStage(candidateId: string, stage: CandidateStage) {
  const before = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!before) throw ApiError.notFound('Candidate not found');
  const updated = await prisma.candidate.update({ where: { id: candidateId }, data: { stage }, include: candidateInclude });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Candidate', entityId: candidateId, before, after: updated });
  return updated;
}

// ---------------------------------------------------------------------------
// Interview + InterviewPanelist
// ---------------------------------------------------------------------------

export async function createInterview(candidateId: string, input: CreateInterviewInput) {
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!candidate) throw ApiError.notFound('Candidate not found');

  const interview = await prisma.interview.create({ data: { ...input, candidateId }, include: { panelists: true } });
  await recordAuditLog({ action: 'CREATE', entityType: 'Interview', entityId: interview.id, after: interview });
  return interview;
}

export async function addPanelist(interviewId: string, input: AddPanelistInput) {
  const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
  if (!interview) throw ApiError.notFound('Interview not found');

  const panelist = await prisma.interviewPanelist.create({ data: { interviewId, interviewerId: input.interviewerId } });
  await recordAuditLog({ action: 'CREATE', entityType: 'InterviewPanelist', entityId: panelist.id, after: panelist });
  return panelist;
}

export async function submitPanelistFeedback(panelistId: string, interviewerId: string, input: PanelistFeedbackInput) {
  const panelist = await prisma.interviewPanelist.findUnique({ where: { id: panelistId } });
  if (!panelist) throw ApiError.notFound('Panelist assignment not found');
  if (panelist.interviewerId !== interviewerId) throw ApiError.forbidden('You are not on this interview panel');

  const updated = await prisma.interviewPanelist.update({
    where: { id: panelistId },
    data: { ...input, submittedAt: new Date() },
  });
  await recordAuditLog({ action: 'UPDATE', entityType: 'InterviewPanelist', entityId: panelistId, after: updated });
  return updated;
}

// ---------------------------------------------------------------------------
// Offer
// ---------------------------------------------------------------------------

export async function createOrUpdateOffer(candidateId: string, input: CreateOfferInput) {
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId }, include: { offer: true } });
  if (!candidate) throw ApiError.notFound('Candidate not found');

  const offer = candidate.offer
    ? await prisma.offer.update({ where: { candidateId }, data: input })
    : await prisma.offer.create({ data: { ...input, candidateId } });

  await recordAuditLog({
    action: candidate.offer ? 'UPDATE' : 'CREATE',
    entityType: 'Offer',
    entityId: offer.id,
    after: offer,
  });
  return offer;
}

export async function sendOffer(candidateId: string) {
  const offer = await prisma.offer.findUnique({ where: { candidateId } });
  if (!offer) throw ApiError.notFound('No offer found for this candidate');

  const updated = await prisma.offer.update({ where: { candidateId }, data: { status: 'SENT', sentAt: new Date() } });
  await recordAuditLog({ action: 'UPDATE', entityType: 'Offer', entityId: updated.id, after: updated });
  return updated;
}

export async function respondToOffer(candidateId: string, input: RespondOfferInput) {
  const offer = await prisma.offer.findUnique({ where: { candidateId } });
  if (!offer) throw ApiError.notFound('No offer found for this candidate');

  const updated = await prisma.offer.update({
    where: { candidateId },
    data: { status: input.accepted ? 'ACCEPTED' : 'DECLINED', respondedAt: new Date() },
  });

  if (input.accepted) {
    await prisma.candidate.update({ where: { id: candidateId }, data: { stage: 'HIRED' } });
  }

  await recordAuditLog({ action: 'UPDATE', entityType: 'Offer', entityId: updated.id, after: updated });
  return updated;
}

export async function deleteJobOpening(id: string) {
  const jobOpening = await prisma.jobOpening.findUnique({ where: { id } });
  if (!jobOpening) throw ApiError.notFound('Job opening not found');
  await softDelete('JobOpening', id);
  await recordAuditLog({ action: 'DELETE', entityType: 'JobOpening', entityId: id, before: jobOpening });
}
