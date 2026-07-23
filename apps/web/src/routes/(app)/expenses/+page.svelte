<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '../../../lib/components/ui/DataTable.svelte';
	import Modal from '../../../lib/components/ui/Modal.svelte';
	import {
		createExpenseClaim,
		listMyExpenseClaims,
		submitExpenseClaim
	} from '../../../lib/features/expense/api.js';
	import type { ExpenseClaim, ExpenseItemInput } from '../../../lib/features/expense/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { toasts } from '../../../lib/stores/toast.js';

	let rows = $state<ExpenseClaim[]>([]);
	let total = $state(0);
	let page = $state(1);
	let loading = $state(true);

	let modalOpen = $state(false);
	let submitting = $state(false);
	let title = $state('');
	let items = $state<ExpenseItemInput[]>([
		{
			category: 'TRAVEL',
			amount: 0,
			expenseDate: new Date().toISOString().slice(0, 10),
			description: ''
		}
	]);

	const columns: Column[] = [
		{ key: 'title', label: 'Title' },
		{ key: 'totalAmount', label: 'Amount', align: 'end' },
		{ key: 'status', label: 'Status' }
	];

	async function load() {
		loading = true;
		try {
			const result = await listMyExpenseClaims({ page, pageSize: 20 });
			rows = result.items;
			total = result.total;
		} catch (err) {
			toasts.error('Could not load expense claims', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function addItem() {
		items = [
			...items,
			{
				category: 'TRAVEL',
				amount: 0,
				expenseDate: new Date().toISOString().slice(0, 10),
				description: ''
			}
		];
	}

	function removeItem(index: number) {
		items = items.filter((_, i) => i !== index);
	}

	function resetForm() {
		title = '';
		items = [
			{
				category: 'TRAVEL',
				amount: 0,
				expenseDate: new Date().toISOString().slice(0, 10),
				description: ''
			}
		];
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		try {
			await createExpenseClaim({ title, items });
			toasts.success('Expense claim created (still a draft — submit it when ready)');
			modalOpen = false;
			resetForm();
			await load();
		} catch (err) {
			toasts.error('Could not create expense claim', extractErrorMessage(err));
		} finally {
			submitting = false;
		}
	}

	async function handleSubmitClaim(claim: ExpenseClaim) {
		try {
			await submitExpenseClaim(claim.id);
			toasts.success('Expense claim submitted for approval');
			await load();
		} catch (err) {
			toasts.error('Could not submit claim', extractErrorMessage(err));
		}
	}
</script>

<svelte:head>
	<title>Expenses — Atyantik EMS</title>
</svelte:head>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
	<div>
		<h1 class="h4 fw-bold mb-1">Expenses</h1>
		<p class="text-muted-2 mb-0">Submit and track your expense claims.</p>
	</div>
	<button type="button" class="btn btn-primary btn-sm" onclick={() => (modalOpen = true)}>
		<i class="bi bi-plus-lg me-1"></i>New Claim
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
			emptyTitle="No expense claims yet"
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
						onclick={() => handleSubmitClaim(row)}
					>
						Submit
					</button>
				{/if}
			{/snippet}
		</DataTable>
	</div>
</div>

<Modal open={modalOpen} title="New Expense Claim" size="lg" onClose={() => (modalOpen = false)}>
	<form id="expense-form" onsubmit={handleSubmit}>
		<div class="mb-3">
			<label for="title" class="form-label small fw-semibold">Title</label>
			<input id="title" type="text" class="form-control" bind:value={title} required />
		</div>

		<div class="d-flex justify-content-between align-items-center mb-2">
			<span class="small fw-semibold">Items</span>
			<button type="button" class="btn btn-sm btn-outline-secondary" onclick={addItem}>
				<i class="bi bi-plus-lg me-1"></i>Add item
			</button>
		</div>

		{#each items as item, i (i)}
			<div class="row g-2 align-items-end mb-2 border-bottom pb-2">
				<div class="col-3">
					<label for="category-{i}" class="form-label small">Category</label>
					<select id="category-{i}" class="form-select form-select-sm" bind:value={item.category}>
						<option value="TRAVEL">Travel</option>
						<option value="FOOD">Food</option>
						<option value="ACCOMMODATION">Accommodation</option>
						<option value="OFFICE_SUPPLIES">Office Supplies</option>
						<option value="CLIENT_ENTERTAINMENT">Client Entertainment</option>
						<option value="OTHER">Other</option>
					</select>
				</div>
				<div class="col-2">
					<label for="amount-{i}" class="form-label small">Amount</label>
					<input
						id="amount-{i}"
						type="number"
						min="0"
						step="0.01"
						class="form-control form-control-sm"
						bind:value={item.amount}
						required
					/>
				</div>
				<div class="col-3">
					<label for="date-{i}" class="form-label small">Date</label>
					<input
						id="date-{i}"
						type="date"
						class="form-control form-control-sm"
						bind:value={item.expenseDate}
						required
					/>
				</div>
				<div class="col-3">
					<label for="desc-{i}" class="form-label small">Description</label>
					<input
						id="desc-{i}"
						type="text"
						class="form-control form-control-sm"
						bind:value={item.description}
					/>
				</div>
				<div class="col-1">
					{#if items.length > 1}
						<button
							type="button"
							class="btn btn-sm btn-outline-danger"
							onclick={() => removeItem(i)}
							aria-label="Remove item"
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
		<button type="submit" form="expense-form" class="btn btn-primary" disabled={submitting}>
			{#if submitting}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Save claim
		</button>
	{/snippet}
</Modal>
