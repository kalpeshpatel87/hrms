<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '../../../lib/components/ui/DataTable.svelte';
	import Modal from '../../../lib/components/ui/Modal.svelte';
	import { createEmployee, listEmployees } from '../../../lib/features/employee/api.js';
	import type {
		CreateEmployeeInput,
		EmployeeListItem
	} from '../../../lib/features/employee/types.js';
	import { listAllDepartments } from '../../../lib/features/org/api.js';
	import type { Department } from '../../../lib/features/org/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { hasPermission } from '../../../lib/stores/auth.js';
	import { toasts } from '../../../lib/stores/toast.js';

	let loading = $state(true);
	let rows = $state<EmployeeListItem[]>([]);
	let total = $state(0);
	let page = $state(1);
	const pageSize = 20;
	let search = $state('');
	let sortBy = $state('createdAt');
	let sortDir = $state<'asc' | 'desc'>('desc');

	let departments = $state<Department[]>([]);
	let departmentFilter = $state('');

	let createModalOpen = $state(false);
	let creating = $state(false);
	let createForm = $state<CreateEmployeeInput>({
		email: '',
		firstName: '',
		lastName: '',
		dateOfJoining: new Date().toISOString().slice(0, 10)
	});

	const canCreate = hasPermission('employee:create');

	const columns: Column[] = [
		{ key: 'employeeCode', label: 'Code', sortable: true, width: '110px' },
		{ key: 'firstName', label: 'Name', sortable: true },
		{ key: 'department.name', label: 'Department' },
		{ key: 'designation.title', label: 'Designation' },
		{ key: 'status', label: 'Status' }
	];

	async function load() {
		loading = true;
		try {
			const result = await listEmployees({
				page,
				pageSize,
				search: search || undefined,
				sortBy,
				sortDir,
				departmentId: departmentFilter || undefined
			});
			rows = result.items;
			total = result.total;
		} catch (err) {
			toasts.error('Could not load employees', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		listAllDepartments()
			.then((d) => (departments = d))
			.catch(() => undefined);
		await load();
	});

	function handleSearchChange(value: string) {
		search = value;
		page = 1;
		void load();
	}

	function handleSortChange(nextSortBy: string, nextSortDir: 'asc' | 'desc') {
		sortBy = nextSortBy;
		sortDir = nextSortDir;
		void load();
	}

	function handlePageChange(nextPage: number) {
		page = nextPage;
		void load();
	}

	function handleDepartmentFilterChange() {
		page = 1;
		void load();
	}

	async function handleCreateSubmit(event: SubmitEvent) {
		event.preventDefault();
		creating = true;
		try {
			const created = await createEmployee(createForm);
			toasts.success(
				'Employee created',
				created.temporaryPassword ? `Temporary password: ${created.temporaryPassword}` : undefined
			);
			createModalOpen = false;
			createForm = {
				email: '',
				firstName: '',
				lastName: '',
				dateOfJoining: new Date().toISOString().slice(0, 10)
			};
			await load();
		} catch (err) {
			toasts.error('Could not create employee', extractErrorMessage(err));
		} finally {
			creating = false;
		}
	}
</script>

<svelte:head>
	<title>Employees — Atyantik EMS</title>
</svelte:head>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
	<div>
		<h1 class="h4 fw-bold mb-1">Employees</h1>
		<p class="text-muted-2 mb-0">Manage your organization's workforce.</p>
	</div>
	<div class="d-flex align-items-center gap-2">
		<select
			class="form-select form-select-sm"
			bind:value={departmentFilter}
			onchange={handleDepartmentFilterChange}
		>
			<option value="">All departments</option>
			{#each departments as dept (dept.id)}
				<option value={dept.id}>{dept.name}</option>
			{/each}
		</select>
		{#if canCreate}
			<button type="button" class="btn btn-primary btn-sm" onclick={() => (createModalOpen = true)}>
				<i class="bi bi-plus-lg me-1"></i>New Employee
			</button>
		{/if}
	</div>
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
			{pageSize}
			{sortBy}
			{sortDir}
			searchPlaceholder="Search by name, code, or email…"
			emptyTitle="No employees found"
			onPageChange={handlePageChange}
			onSortChange={handleSortChange}
			onSearchChange={handleSearchChange}
		>
			{#snippet rowActions(row)}
				<a href="/employees/{row.id}" class="btn btn-sm btn-outline-secondary">View</a>
			{/snippet}
		</DataTable>
	</div>
</div>

<Modal open={createModalOpen} title="New Employee" onClose={() => (createModalOpen = false)}>
	<form id="create-employee-form" onsubmit={handleCreateSubmit}>
		<div class="mb-3">
			<label for="email" class="form-label small fw-semibold">Work email</label>
			<input id="email" type="email" class="form-control" bind:value={createForm.email} required />
		</div>
		<div class="row g-3 mb-3">
			<div class="col-6">
				<label for="firstName" class="form-label small fw-semibold">First name</label>
				<input
					id="firstName"
					type="text"
					class="form-control"
					bind:value={createForm.firstName}
					required
				/>
			</div>
			<div class="col-6">
				<label for="lastName" class="form-label small fw-semibold">Last name</label>
				<input
					id="lastName"
					type="text"
					class="form-control"
					bind:value={createForm.lastName}
					required
				/>
			</div>
		</div>
		<div class="row g-3 mb-3">
			<div class="col-6">
				<label for="department" class="form-label small fw-semibold">Department</label>
				<select id="department" class="form-select" bind:value={createForm.departmentId}>
					<option value={undefined}>—</option>
					{#each departments as dept (dept.id)}
						<option value={dept.id}>{dept.name}</option>
					{/each}
				</select>
			</div>
			<div class="col-6">
				<label for="dateOfJoining" class="form-label small fw-semibold">Date of joining</label>
				<input
					id="dateOfJoining"
					type="date"
					class="form-control"
					bind:value={createForm.dateOfJoining}
					required
				/>
			</div>
		</div>
		<p class="text-muted-2 small mb-0">
			A temporary password is generated automatically and shown after creation; the employee will be
			required to change it on first login.
		</p>
	</form>

	{#snippet footer()}
		<button
			type="button"
			class="btn btn-outline-secondary"
			onclick={() => (createModalOpen = false)}>Cancel</button
		>
		<button type="submit" form="create-employee-form" class="btn btn-primary" disabled={creating}>
			{#if creating}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Create employee
		</button>
	{/snippet}
</Modal>
