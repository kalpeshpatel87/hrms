<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '../../../../lib/components/ui/DataTable.svelte';
	import Modal from '../../../../lib/components/ui/Modal.svelte';
	import {
		createDepartment,
		deleteDepartment,
		listDepartments,
		updateDepartment
	} from '../../../../lib/features/admin/api.js';
	import type {
		CreateDepartmentInput,
		DepartmentRow
	} from '../../../../lib/features/admin/types.js';
	import { extractErrorMessage } from '../../../../lib/services/api-client.js';
	import { toasts } from '../../../../lib/stores/toast.js';

	let rows = $state<DepartmentRow[]>([]);
	let total = $state(0);
	let page = $state(1);
	let loading = $state(true);

	let modalOpen = $state(false);
	let editingId = $state<string | null>(null);
	let submitting = $state(false);
	let form = $state<CreateDepartmentInput>({ name: '', code: '' });

	const columns: Column[] = [
		{ key: 'name', label: 'Name', sortable: true },
		{ key: 'code', label: 'Code' },
		{ key: '_count.employees', label: 'Employees', align: 'center' },
		{ key: '_count.subDepartments', label: 'Sub-departments', align: 'center' }
	];

	async function load() {
		loading = true;
		try {
			const result = await listDepartments({ page, pageSize: 20 });
			rows = result.items;
			total = result.total;
		} catch (err) {
			toasts.error('Could not load departments', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function openCreate() {
		editingId = null;
		form = { name: '', code: '' };
		modalOpen = true;
	}

	function openEdit(row: DepartmentRow) {
		editingId = row.id;
		form = { name: row.name, code: row.code };
		modalOpen = true;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		try {
			if (editingId) {
				await updateDepartment(editingId, form);
				toasts.success('Department updated');
			} else {
				await createDepartment(form);
				toasts.success('Department created');
			}
			modalOpen = false;
			await load();
		} catch (err) {
			toasts.error('Could not save department', extractErrorMessage(err));
		} finally {
			submitting = false;
		}
	}

	async function handleDelete(id: string) {
		try {
			await deleteDepartment(id);
			toasts.success('Department deleted');
			await load();
		} catch (err) {
			toasts.error('Could not delete department', extractErrorMessage(err));
		}
	}
</script>

<svelte:head>
	<title>Departments — Atyantik EMS</title>
</svelte:head>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
	<div>
		<h1 class="h4 fw-bold mb-1">Departments</h1>
		<p class="text-muted-2 mb-0">Manage your organization's department structure.</p>
	</div>
	<button type="button" class="btn btn-primary btn-sm" onclick={openCreate}>
		<i class="bi bi-plus-lg me-1"></i>New Department
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
			emptyTitle="No departments yet"
			onPageChange={(p) => {
				page = p;
				void load();
			}}
		>
			{#snippet rowActions(row)}
				<div class="d-flex gap-1 justify-content-end">
					<button
						type="button"
						class="btn btn-sm btn-outline-secondary"
						onclick={() => openEdit(row)}>Edit</button
					>
					<button
						type="button"
						class="btn btn-sm btn-outline-danger"
						onclick={() => handleDelete(row.id)}>Delete</button
					>
				</div>
			{/snippet}
		</DataTable>
	</div>
</div>

<Modal
	open={modalOpen}
	title={editingId ? 'Edit Department' : 'New Department'}
	onClose={() => (modalOpen = false)}
>
	<form id="department-form" onsubmit={handleSubmit}>
		<div class="mb-3">
			<label for="name" class="form-label small fw-semibold">Name</label>
			<input id="name" type="text" class="form-control" bind:value={form.name} required />
		</div>
		<div class="mb-0">
			<label for="code" class="form-label small fw-semibold">Code</label>
			<input id="code" type="text" class="form-control" bind:value={form.code} required />
		</div>
	</form>

	{#snippet footer()}
		<button type="button" class="btn btn-outline-secondary" onclick={() => (modalOpen = false)}
			>Cancel</button
		>
		<button type="submit" form="department-form" class="btn btn-primary" disabled={submitting}>
			{#if submitting}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Save
		</button>
	{/snippet}
</Modal>
