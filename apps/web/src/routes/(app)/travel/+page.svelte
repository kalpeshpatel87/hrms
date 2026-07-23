<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '../../../lib/components/ui/DataTable.svelte';
	import Modal from '../../../lib/components/ui/Modal.svelte';
	import { createTravelRequest, listMyTravelRequests } from '../../../lib/features/travel/api.js';
	import type {
		CreateTravelRequestInput,
		TravelRequest
	} from '../../../lib/features/travel/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { toasts } from '../../../lib/stores/toast.js';

	let rows = $state<TravelRequest[]>([]);
	let total = $state(0);
	let page = $state(1);
	let loading = $state(true);

	let modalOpen = $state(false);
	let submitting = $state(false);
	let form = $state<CreateTravelRequestInput>({
		purpose: '',
		origin: '',
		destination: '',
		startDate: '',
		endDate: ''
	});

	const columns: Column[] = [
		{ key: 'purpose', label: 'Purpose' },
		{ key: 'origin', label: 'From' },
		{ key: 'destination', label: 'To' },
		{ key: 'startDate', label: 'Start' },
		{ key: 'endDate', label: 'End' },
		{ key: 'status', label: 'Status' }
	];

	async function load() {
		loading = true;
		try {
			const result = await listMyTravelRequests({ page, pageSize: 20 });
			rows = result.items;
			total = result.total;
		} catch (err) {
			toasts.error('Could not load travel requests', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		try {
			await createTravelRequest(form);
			toasts.success('Travel request submitted');
			modalOpen = false;
			form = { purpose: '', origin: '', destination: '', startDate: '', endDate: '' };
			await load();
		} catch (err) {
			toasts.error('Could not submit travel request', extractErrorMessage(err));
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Travel — Atyantik EMS</title>
</svelte:head>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
	<div>
		<h1 class="h4 fw-bold mb-1">Travel</h1>
		<p class="text-muted-2 mb-0">Request and track business travel.</p>
	</div>
	<button type="button" class="btn btn-primary btn-sm" onclick={() => (modalOpen = true)}>
		<i class="bi bi-plus-lg me-1"></i>New Request
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
			emptyTitle="No travel requests yet"
			onPageChange={(p) => {
				page = p;
				void load();
			}}
		/>
	</div>
</div>

<Modal open={modalOpen} title="New Travel Request" onClose={() => (modalOpen = false)}>
	<form id="travel-form" onsubmit={handleSubmit}>
		<div class="mb-3">
			<label for="purpose" class="form-label small fw-semibold">Purpose</label>
			<input id="purpose" type="text" class="form-control" bind:value={form.purpose} required />
		</div>
		<div class="row g-3 mb-3">
			<div class="col-6">
				<label for="origin" class="form-label small fw-semibold">From</label>
				<input id="origin" type="text" class="form-control" bind:value={form.origin} required />
			</div>
			<div class="col-6">
				<label for="destination" class="form-label small fw-semibold">To</label>
				<input
					id="destination"
					type="text"
					class="form-control"
					bind:value={form.destination}
					required
				/>
			</div>
		</div>
		<div class="row g-3 mb-0">
			<div class="col-6">
				<label for="startDate" class="form-label small fw-semibold">Start date</label>
				<input
					id="startDate"
					type="date"
					class="form-control"
					bind:value={form.startDate}
					required
				/>
			</div>
			<div class="col-6">
				<label for="endDate" class="form-label small fw-semibold">End date</label>
				<input id="endDate" type="date" class="form-control" bind:value={form.endDate} required />
			</div>
		</div>
	</form>

	{#snippet footer()}
		<button type="button" class="btn btn-outline-secondary" onclick={() => (modalOpen = false)}
			>Cancel</button
		>
		<button type="submit" form="travel-form" class="btn btn-primary" disabled={submitting}>
			{#if submitting}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Submit request
		</button>
	{/snippet}
</Modal>
