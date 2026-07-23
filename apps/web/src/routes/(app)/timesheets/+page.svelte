<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '../../../lib/components/ui/DataTable.svelte';
	import Modal from '../../../lib/components/ui/Modal.svelte';
	import {
		listMyTimesheets,
		listProjects,
		saveTimesheet,
		submitTimesheet
	} from '../../../lib/features/timesheet/api.js';
	import type {
		Project,
		Timesheet,
		TimesheetEntry
	} from '../../../lib/features/timesheet/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { toasts } from '../../../lib/stores/toast.js';

	let rows = $state<Timesheet[]>([]);
	let total = $state(0);
	let page = $state(1);
	let loading = $state(true);
	let projects = $state<Project[]>([]);

	let modalOpen = $state(false);
	let submitting = $state(false);
	let weekStartDate = $state(new Date().toISOString().slice(0, 10));
	let entries = $state<TimesheetEntry[]>([
		{ projectId: '', date: new Date().toISOString().slice(0, 10), hours: 8, isBillable: true }
	]);

	const columns: Column[] = [
		{ key: 'weekStartDate', label: 'Week of' },
		{ key: 'status', label: 'Status' }
	];

	async function load() {
		loading = true;
		try {
			const [result, projectList] = await Promise.all([
				listMyTimesheets({ page, pageSize: 20 }),
				listProjects()
			]);
			rows = result.items;
			total = result.total;
			projects = projectList;
		} catch (err) {
			toasts.error('Could not load timesheets', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function addEntry() {
		entries = [
			...entries,
			{ projectId: projects[0]?.id ?? '', date: weekStartDate, hours: 8, isBillable: true }
		];
	}

	function removeEntry(index: number) {
		entries = entries.filter((_, i) => i !== index);
	}

	function resetForm() {
		weekStartDate = new Date().toISOString().slice(0, 10);
		entries = [
			{ projectId: projects[0]?.id ?? '', date: weekStartDate, hours: 8, isBillable: true }
		];
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		try {
			await saveTimesheet({ weekStartDate, entries });
			toasts.success('Timesheet saved as draft');
			modalOpen = false;
			resetForm();
			await load();
		} catch (err) {
			toasts.error('Could not save timesheet', extractErrorMessage(err));
		} finally {
			submitting = false;
		}
	}

	async function handleSubmitTimesheet(timesheet: Timesheet) {
		try {
			await submitTimesheet(timesheet.id);
			toasts.success('Timesheet submitted for approval');
			await load();
		} catch (err) {
			toasts.error('Could not submit timesheet', extractErrorMessage(err));
		}
	}
</script>

<svelte:head>
	<title>Timesheets — Atyantik EMS</title>
</svelte:head>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
	<div>
		<h1 class="h4 fw-bold mb-1">Timesheets</h1>
		<p class="text-muted-2 mb-0">Log your hours by project each week.</p>
	</div>
	<button type="button" class="btn btn-primary btn-sm" onclick={() => (modalOpen = true)}>
		<i class="bi bi-plus-lg me-1"></i>Log Time
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
			emptyTitle="No timesheets logged yet"
			onPageChange={(p) => {
				page = p;
				void load();
			}}
		>
			{#snippet rowActions(row)}
				{#if row.status === 'DRAFT'}
					<button
						type="button"
						class="btn btn-sm btn-outline-primary"
						onclick={() => handleSubmitTimesheet(row)}
					>
						Submit
					</button>
				{/if}
			{/snippet}
		</DataTable>
	</div>
</div>

<Modal open={modalOpen} title="Log Time" size="lg" onClose={() => (modalOpen = false)}>
	<form id="timesheet-form" onsubmit={handleSubmit}>
		<div class="mb-3">
			<label for="weekStartDate" class="form-label small fw-semibold">Week starting</label>
			<input
				id="weekStartDate"
				type="date"
				class="form-control"
				bind:value={weekStartDate}
				required
			/>
		</div>

		<div class="d-flex justify-content-between align-items-center mb-2">
			<span class="small fw-semibold">Entries</span>
			<button type="button" class="btn btn-sm btn-outline-secondary" onclick={addEntry}>
				<i class="bi bi-plus-lg me-1"></i>Add entry
			</button>
		</div>

		{#if projects.length === 0}
			<p class="text-muted-2 small">No projects available — ask your admin to create one first.</p>
		{/if}

		{#each entries as entry, i (i)}
			<div class="row g-2 align-items-end mb-2 border-bottom pb-2">
				<div class="col-4">
					<label for="project-{i}" class="form-label small">Project</label>
					<select
						id="project-{i}"
						class="form-select form-select-sm"
						bind:value={entry.projectId}
						required
					>
						{#each projects as project (project.id)}
							<option value={project.id}>{project.name}</option>
						{/each}
					</select>
				</div>
				<div class="col-3">
					<label for="date-{i}" class="form-label small">Date</label>
					<input
						id="date-{i}"
						type="date"
						class="form-control form-control-sm"
						bind:value={entry.date}
						required
					/>
				</div>
				<div class="col-2">
					<label for="hours-{i}" class="form-label small">Hours</label>
					<input
						id="hours-{i}"
						type="number"
						min="0"
						max="24"
						step="0.5"
						class="form-control form-control-sm"
						bind:value={entry.hours}
						required
					/>
				</div>
				<div class="col-2">
					<label for="desc-{i}" class="form-label small">Notes</label>
					<input
						id="desc-{i}"
						type="text"
						class="form-control form-control-sm"
						bind:value={entry.description}
					/>
				</div>
				<div class="col-1">
					{#if entries.length > 1}
						<button
							type="button"
							class="btn btn-sm btn-outline-danger"
							onclick={() => removeEntry(i)}
							aria-label="Remove entry"
						>
							<i class="bi bi-trash"></i>
						</button>
					{/if}
				</div>
			</div>
		{/each}
	</form>

	{#snippet footer()}
		<button type="button" class="btn btn-outline-secondary" onclick={() => (modalOpen = false)}
			>Cancel</button
		>
		<button
			type="submit"
			form="timesheet-form"
			class="btn btn-primary"
			disabled={submitting || projects.length === 0}
		>
			{#if submitting}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Save timesheet
		</button>
	{/snippet}
</Modal>
