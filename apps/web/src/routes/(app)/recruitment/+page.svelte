<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '../../../lib/components/ui/DataTable.svelte';
	import Modal from '../../../lib/components/ui/Modal.svelte';
	import { createJobOpening, listJobOpenings } from '../../../lib/features/recruitment/api.js';
	import type {
		CreateJobOpeningInput,
		JobOpening
	} from '../../../lib/features/recruitment/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { toasts } from '../../../lib/stores/toast.js';

	let rows = $state<JobOpening[]>([]);
	let total = $state(0);
	let page = $state(1);
	let loading = $state(true);

	let modalOpen = $state(false);
	let submitting = $state(false);
	let form = $state<CreateJobOpeningInput>({
		title: '',
		employmentType: 'FULL_TIME',
		numberOfPositions: 1,
		status: 'OPEN'
	});

	const columns: Column[] = [
		{ key: 'title', label: 'Title' },
		{ key: 'employmentType', label: 'Type' },
		{ key: 'numberOfPositions', label: 'Positions', align: 'center' },
		{ key: '_count.candidates', label: 'Candidates', align: 'center' },
		{ key: 'status', label: 'Status' }
	];

	async function load() {
		loading = true;
		try {
			const result = await listJobOpenings({ page, pageSize: 20 });
			rows = result.items;
			total = result.total;
		} catch (err) {
			toasts.error('Could not load job openings', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		try {
			await createJobOpening(form);
			toasts.success('Job opening created');
			modalOpen = false;
			form = { title: '', employmentType: 'FULL_TIME', numberOfPositions: 1, status: 'OPEN' };
			await load();
		} catch (err) {
			toasts.error('Could not create job opening', extractErrorMessage(err));
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Recruitment — Atyantik EMS</title>
</svelte:head>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
	<div>
		<h1 class="h4 fw-bold mb-1">Recruitment</h1>
		<p class="text-muted-2 mb-0">Manage job openings and candidates.</p>
	</div>
	<button type="button" class="btn btn-primary btn-sm" onclick={() => (modalOpen = true)}>
		<i class="bi bi-plus-lg me-1"></i>New Job Opening
	</button>
</div>

<div class="card border-0 shadow-sm">
	<div class="card-body">
		<DataTable
			{columns}
			{rows}
			rowKey={(row) => row.id}
			{loading}
			{total}
			{page}
			pageSize={20}
			searchable={false}
			emptyTitle="No job openings yet"
			onPageChange={(p) => {
				page = p;
				void load();
			}}
		>
			{#snippet rowActions(row)}
				<a href="/recruitment/{row.id}" class="btn btn-sm btn-outline-secondary">View candidates</a>
			{/snippet}
		</DataTable>
	</div>
</div>

<Modal open={modalOpen} title="New Job Opening" onClose={() => (modalOpen = false)}>
	<form id="job-opening-form" onsubmit={handleSubmit}>
		<div class="mb-3">
			<label for="title" class="form-label small fw-semibold">Title</label>
			<input id="title" type="text" class="form-control" bind:value={form.title} required />
		</div>
		<div class="row g-3">
			<div class="col-6">
				<label for="employmentType" class="form-label small fw-semibold">Employment type</label>
				<select id="employmentType" class="form-select" bind:value={form.employmentType}>
					<option value="FULL_TIME">Full-time</option>
					<option value="PART_TIME">Part-time</option>
					<option value="CONTRACT">Contract</option>
					<option value="INTERN">Intern</option>
					<option value="CONSULTANT">Consultant</option>
				</select>
			</div>
			<div class="col-6">
				<label for="numberOfPositions" class="form-label small fw-semibold">Positions</label>
				<input
					id="numberOfPositions"
					type="number"
					min="1"
					class="form-control"
					bind:value={form.numberOfPositions}
					required
				/>
			</div>
		</div>
	</form>

	{#snippet footer()}
		<button type="button" class="btn btn-outline-secondary" onclick={() => (modalOpen = false)}
			>Cancel</button
		>
		<button type="submit" form="job-opening-form" class="btn btn-primary" disabled={submitting}>
			{#if submitting}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Create
		</button>
	{/snippet}
</Modal>
