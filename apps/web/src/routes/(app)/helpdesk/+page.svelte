<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '../../../lib/components/ui/DataTable.svelte';
	import Modal from '../../../lib/components/ui/Modal.svelte';
	import { createTicket, listMyTickets } from '../../../lib/features/helpdesk/api.js';
	import type { CreateTicketInput, Ticket } from '../../../lib/features/helpdesk/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { toasts } from '../../../lib/stores/toast.js';

	let rows = $state<Ticket[]>([]);
	let total = $state(0);
	let page = $state(1);
	let loading = $state(true);

	let modalOpen = $state(false);
	let submitting = $state(false);
	let form = $state<CreateTicketInput>({
		category: 'IT',
		priority: 'MEDIUM',
		subject: '',
		description: ''
	});

	const columns: Column[] = [
		{ key: 'ticketNumber', label: 'Ticket #', width: '120px' },
		{ key: 'subject', label: 'Subject' },
		{ key: 'category', label: 'Category' },
		{ key: 'priority', label: 'Priority' },
		{ key: 'status', label: 'Status' }
	];

	async function load() {
		loading = true;
		try {
			const result = await listMyTickets({ page, pageSize: 20 });
			rows = result.items;
			total = result.total;
		} catch (err) {
			toasts.error('Could not load tickets', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		try {
			await createTicket(form);
			toasts.success('Ticket raised successfully');
			modalOpen = false;
			form = { category: 'IT', priority: 'MEDIUM', subject: '', description: '' };
			await load();
		} catch (err) {
			toasts.error('Could not raise ticket', extractErrorMessage(err));
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Helpdesk — Atyantik EMS</title>
</svelte:head>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
	<div>
		<h1 class="h4 fw-bold mb-1">Helpdesk</h1>
		<p class="text-muted-2 mb-0">Raise and track IT, HR, and admin support tickets.</p>
	</div>
	<button type="button" class="btn btn-primary btn-sm" onclick={() => (modalOpen = true)}>
		<i class="bi bi-plus-lg me-1"></i>New Ticket
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
			emptyTitle="No tickets raised yet"
			onPageChange={(p) => {
				page = p;
				void load();
			}}
		>
			{#snippet rowActions(row)}
				<a href="/helpdesk/{row.id}" class="btn btn-sm btn-outline-secondary">View</a>
			{/snippet}
		</DataTable>
	</div>
</div>

<Modal open={modalOpen} title="Raise a Ticket" onClose={() => (modalOpen = false)}>
	<form id="ticket-form" onsubmit={handleSubmit}>
		<div class="row g-3 mb-3">
			<div class="col-6">
				<label for="category" class="form-label small fw-semibold">Category</label>
				<select id="category" class="form-select" bind:value={form.category}>
					<option value="IT">IT</option>
					<option value="HR">HR</option>
					<option value="FINANCE">Finance</option>
					<option value="ADMIN">Admin</option>
					<option value="FACILITIES">Facilities</option>
					<option value="OTHER">Other</option>
				</select>
			</div>
			<div class="col-6">
				<label for="priority" class="form-label small fw-semibold">Priority</label>
				<select id="priority" class="form-select" bind:value={form.priority}>
					<option value="LOW">Low</option>
					<option value="MEDIUM">Medium</option>
					<option value="HIGH">High</option>
					<option value="URGENT">Urgent</option>
				</select>
			</div>
		</div>
		<div class="mb-3">
			<label for="subject" class="form-label small fw-semibold">Subject</label>
			<input id="subject" type="text" class="form-control" bind:value={form.subject} required />
		</div>
		<div class="mb-0">
			<label for="description" class="form-label small fw-semibold">Description</label>
			<textarea id="description" class="form-control" rows="4" bind:value={form.description}
			></textarea>
		</div>
	</form>

	{#snippet footer()}
		<button type="button" class="btn btn-outline-secondary" onclick={() => (modalOpen = false)}
			>Cancel</button
		>
		<button type="submit" form="ticket-form" class="btn btn-primary" disabled={submitting}>
			{#if submitting}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Raise ticket
		</button>
	{/snippet}
</Modal>
