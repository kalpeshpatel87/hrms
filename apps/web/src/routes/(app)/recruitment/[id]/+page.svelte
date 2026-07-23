<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '../../../../lib/components/ui/DataTable.svelte';
	import Modal from '../../../../lib/components/ui/Modal.svelte';
	import {
		addCandidate,
		listCandidates,
		updateCandidateStage
	} from '../../../../lib/features/recruitment/api.js';
	import type {
		Candidate,
		CandidateStage,
		CreateCandidateInput
	} from '../../../../lib/features/recruitment/types.js';
	import { extractErrorMessage } from '../../../../lib/services/api-client.js';
	import { toasts } from '../../../../lib/stores/toast.js';

	let candidates = $state<Candidate[]>([]);
	let loading = $state(true);
	let modalOpen = $state(false);
	let submitting = $state(false);
	let form = $state<CreateCandidateInput>({ firstName: '', lastName: '', email: '' });

	const stages: CandidateStage[] = [
		'APPLIED',
		'SCREENING',
		'INTERVIEW',
		'OFFER',
		'HIRED',
		'REJECTED',
		'WITHDRAWN'
	];

	const columns: Column[] = [
		{ key: 'firstName', label: 'First name' },
		{ key: 'lastName', label: 'Last name' },
		{ key: 'email', label: 'Email' },
		{ key: 'stage', label: 'Stage' }
	];

	async function load() {
		loading = true;
		try {
			candidates = await listCandidates(page.params.id as string);
		} catch (err) {
			toasts.error('Could not load candidates', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		try {
			await addCandidate(page.params.id as string, form);
			toasts.success('Candidate added');
			modalOpen = false;
			form = { firstName: '', lastName: '', email: '' };
			await load();
		} catch (err) {
			toasts.error('Could not add candidate', extractErrorMessage(err));
		} finally {
			submitting = false;
		}
	}

	async function handleStageChange(candidate: Candidate, stage: CandidateStage) {
		try {
			await updateCandidateStage(candidate.id, stage);
			toasts.success('Candidate stage updated');
			await load();
		} catch (err) {
			toasts.error('Could not update stage', extractErrorMessage(err));
		}
	}
</script>

<svelte:head>
	<title>Candidates — Atyantik EMS</title>
</svelte:head>

<a href="/recruitment" class="d-inline-flex align-items-center gap-1 mb-3 small">
	<i class="bi bi-arrow-left"></i> Back to job openings
</a>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
	<h1 class="h4 fw-bold mb-0">Candidates</h1>
	<button type="button" class="btn btn-primary btn-sm" onclick={() => (modalOpen = true)}>
		<i class="bi bi-plus-lg me-1"></i>Add Candidate
	</button>
</div>

<div class="card border-0 shadow-sm">
	<div class="card-body">
		<DataTable
			{columns}
			rows={candidates}
			rowKey={(row) => row.id}
			{loading}
			searchable={false}
			emptyTitle="No candidates yet for this opening"
		>
			{#snippet rowActions(row)}
				<select
					class="form-select form-select-sm d-inline-block"
					style="width: auto;"
					value={row.stage}
					onchange={(e) =>
						handleStageChange(row, (e.currentTarget as HTMLSelectElement).value as CandidateStage)}
				>
					{#each stages as stage (stage)}
						<option value={stage}>{stage}</option>
					{/each}
				</select>
			{/snippet}
		</DataTable>
	</div>
</div>

<Modal open={modalOpen} title="Add Candidate" onClose={() => (modalOpen = false)}>
	<form id="candidate-form" onsubmit={handleSubmit}>
		<div class="row g-3 mb-3">
			<div class="col-6">
				<label for="firstName" class="form-label small fw-semibold">First name</label>
				<input
					id="firstName"
					type="text"
					class="form-control"
					bind:value={form.firstName}
					required
				/>
			</div>
			<div class="col-6">
				<label for="lastName" class="form-label small fw-semibold">Last name</label>
				<input id="lastName" type="text" class="form-control" bind:value={form.lastName} required />
			</div>
		</div>
		<div class="mb-0">
			<label for="email" class="form-label small fw-semibold">Email</label>
			<input id="email" type="email" class="form-control" bind:value={form.email} required />
		</div>
	</form>

	{#snippet footer()}
		<button type="button" class="btn btn-outline-secondary" onclick={() => (modalOpen = false)}
			>Cancel</button
		>
		<button type="submit" form="candidate-form" class="btn btn-primary" disabled={submitting}>
			{#if submitting}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Add candidate
		</button>
	{/snippet}
</Modal>
