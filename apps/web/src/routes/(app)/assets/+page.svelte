<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '../../../lib/components/ui/DataTable.svelte';
	import EmptyState from '../../../lib/components/ui/EmptyState.svelte';
	import Modal from '../../../lib/components/ui/Modal.svelte';
	import {
		assignAsset,
		createAsset,
		deleteAsset,
		listAssets,
		listMyAssets,
		returnAsset
	} from '../../../lib/features/asset/api.js';
	import type {
		AssetAssignment,
		AssetRow,
		CreateAssetInput
	} from '../../../lib/features/asset/types.js';
	import { listEmployees } from '../../../lib/features/employee/api.js';
	import type { EmployeeListItem } from '../../../lib/features/employee/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { hasPermission } from '../../../lib/stores/auth.js';
	import { toasts } from '../../../lib/stores/toast.js';

	const canManageAssets = hasPermission('asset:create');
	let activeTab = $state<'mine' | 'catalog'>('mine');

	let assignments = $state<AssetAssignment[]>([]);
	let loadingMine = $state(true);

	let rows = $state<AssetRow[]>([]);
	let total = $state(0);
	let page = $state(1);
	let loadingCatalog = $state(false);
	let employees = $state<EmployeeListItem[]>([]);

	let createModalOpen = $state(false);
	let submitting = $state(false);
	let createForm = $state<CreateAssetInput>({ assetCode: '', name: '', category: 'LAPTOP' });

	let assignModalOpen = $state(false);
	let assigningAsset = $state<AssetRow | null>(null);
	let assignEmployeeId = $state('');

	const categoryIcon: Record<string, string> = {
		LAPTOP: 'bi-laptop',
		DESKTOP: 'bi-pc-display',
		MONITOR: 'bi-display',
		MOBILE: 'bi-phone',
		PERIPHERAL: 'bi-mouse2',
		FURNITURE: 'bi-lamp',
		SOFTWARE_LICENSE: 'bi-key',
		VEHICLE: 'bi-car-front',
		OTHER: 'bi-box'
	};

	const catalogColumns: Column[] = [
		{ key: 'assetCode', label: 'Code' },
		{ key: 'name', label: 'Name' },
		{ key: 'category', label: 'Category' },
		{ key: 'status', label: 'Status' }
	];

	async function loadMine() {
		loadingMine = true;
		try {
			assignments = await listMyAssets();
		} catch (err) {
			toasts.error('Could not load your assets', extractErrorMessage(err));
		} finally {
			loadingMine = false;
		}
	}

	async function loadCatalog() {
		loadingCatalog = true;
		try {
			const result = await listAssets({ page, pageSize: 20 });
			rows = result.items;
			total = result.total;
		} catch (err) {
			toasts.error('Could not load asset catalog', extractErrorMessage(err));
		} finally {
			loadingCatalog = false;
		}
	}

	onMount(async () => {
		const tasks = [loadMine()];
		if (canManageAssets) {
			tasks.push(loadCatalog());
			tasks.push(
				listEmployees({ page: 1, pageSize: 200 }).then((result) => {
					employees = result.items;
				})
			);
		}
		await Promise.all(tasks);
	});

	function openCreate() {
		createForm = { assetCode: '', name: '', category: 'LAPTOP' };
		createModalOpen = true;
	}

	async function handleCreateSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		try {
			await createAsset(createForm);
			toasts.success('Asset added to the catalog');
			createModalOpen = false;
			await loadCatalog();
		} catch (err) {
			toasts.error('Could not create asset', extractErrorMessage(err));
		} finally {
			submitting = false;
		}
	}

	async function handleDelete(id: string) {
		try {
			await deleteAsset(id);
			toasts.success('Asset removed');
			await loadCatalog();
		} catch (err) {
			toasts.error('Could not remove asset', extractErrorMessage(err));
		}
	}

	function openAssign(row: AssetRow) {
		assigningAsset = row;
		assignEmployeeId = '';
		assignModalOpen = true;
	}

	async function handleAssignSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!assigningAsset) return;
		submitting = true;
		try {
			await assignAsset(assigningAsset.id, { employeeId: assignEmployeeId });
			toasts.success('Asset assigned');
			assignModalOpen = false;
			await loadCatalog();
		} catch (err) {
			toasts.error('Could not assign asset', extractErrorMessage(err));
		} finally {
			submitting = false;
		}
	}

	async function handleReturn(row: AssetRow) {
		const assignment = row.assignments[0];
		if (!assignment) return;
		try {
			await returnAsset(assignment.id, 'GOOD');
			toasts.success('Asset marked as returned');
			await loadCatalog();
		} catch (err) {
			toasts.error('Could not return asset', extractErrorMessage(err));
		}
	}
</script>

<svelte:head>
	<title>Assets — Atyantik EMS</title>
</svelte:head>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
	<div>
		<h1 class="h4 fw-bold mb-1">Assets</h1>
		<p class="text-muted-2 mb-0">
			Company equipment assigned to you{canManageAssets ? ', and the full asset catalog' : ''}.
		</p>
	</div>
	{#if canManageAssets && activeTab === 'catalog'}
		<button type="button" class="btn btn-primary btn-sm" onclick={openCreate}>
			<i class="bi bi-plus-lg me-1"></i>New Asset
		</button>
	{/if}
</div>

{#if canManageAssets}
	<ul class="nav nav-tabs mb-3">
		<li class="nav-item">
			<button
				type="button"
				class="nav-link"
				class:active={activeTab === 'mine'}
				onclick={() => (activeTab = 'mine')}
			>
				My Assets
			</button>
		</li>
		<li class="nav-item">
			<button
				type="button"
				class="nav-link"
				class:active={activeTab === 'catalog'}
				onclick={() => (activeTab = 'catalog')}
			>
				Asset Catalog (Admin)
			</button>
		</li>
	</ul>
{/if}

{#if activeTab === 'mine' || !canManageAssets}
	{#if loadingMine}
		<div class="row g-3">
			{#each [0, 1, 2] as skeletonRow (skeletonRow)}
				<div class="col-md-6 col-lg-4">
					<div class="skeleton" style="height: 120px;"></div>
				</div>
			{/each}
		</div>
	{:else if assignments.length === 0}
		<EmptyState icon="bi-laptop" title="No assets currently assigned to you" />
	{:else}
		<div class="row g-3">
			{#each assignments as assignment (assignment.id)}
				<div class="col-md-6 col-lg-4">
					<div class="card border-0 shadow-sm h-100">
						<div class="card-body d-flex gap-3">
							<i class="bi {categoryIcon[assignment.asset.category] ?? 'bi-box'} fs-3 text-primary"
							></i>
							<div>
								<div class="fw-semibold">{assignment.asset.name}</div>
								<div class="text-muted-2 small">{assignment.asset.assetCode}</div>
								<div class="text-muted-2 small">
									{assignment.asset.brand ?? ''}
									{assignment.asset.model ?? ''}
								</div>
								<div class="text-muted-2 small">
									Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
{:else}
	<div class="card border-0 shadow-sm">
		<div class="card-body">
			<DataTable
				columns={catalogColumns}
				{rows}
				rowKey={(row) => row.id}
				loading={loadingCatalog}
				{total}
				{page}
				pageSize={20}
				searchable={false}
				emptyTitle="No assets in the catalog yet"
				onPageChange={(p) => {
					page = p;
					void loadCatalog();
				}}
			>
				{#snippet rowActions(row)}
					<div class="d-flex gap-1 justify-content-end align-items-center">
						{#if row.assignments[0]}
							<span class="text-muted-2 small me-2">
								{row.assignments[0].employee.firstName}
								{row.assignments[0].employee.lastName}
							</span>
							<button
								type="button"
								class="btn btn-sm btn-outline-secondary"
								onclick={() => handleReturn(row)}>Mark Returned</button
							>
						{:else if row.status === 'AVAILABLE'}
							<button
								type="button"
								class="btn btn-sm btn-outline-primary"
								onclick={() => openAssign(row)}>Assign</button
							>
						{/if}
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
{/if}

<Modal open={createModalOpen} title="New Asset" onClose={() => (createModalOpen = false)}>
	<form id="asset-form" onsubmit={handleCreateSubmit}>
		<div class="row g-3">
			<div class="col-6">
				<label for="assetCode" class="form-label small fw-semibold">Asset code</label>
				<input
					id="assetCode"
					type="text"
					class="form-control"
					bind:value={createForm.assetCode}
					required
				/>
			</div>
			<div class="col-6">
				<label for="name" class="form-label small fw-semibold">Name</label>
				<input id="name" type="text" class="form-control" bind:value={createForm.name} required />
			</div>
			<div class="col-6">
				<label for="category" class="form-label small fw-semibold">Category</label>
				<select id="category" class="form-select" bind:value={createForm.category}>
					{#each Object.keys(categoryIcon) as category (category)}
						<option value={category}>{category}</option>
					{/each}
				</select>
			</div>
			<div class="col-6">
				<label for="brand" class="form-label small fw-semibold">Brand</label>
				<input id="brand" type="text" class="form-control" bind:value={createForm.brand} />
			</div>
			<div class="col-6">
				<label for="model" class="form-label small fw-semibold">Model</label>
				<input id="model" type="text" class="form-control" bind:value={createForm.model} />
			</div>
			<div class="col-6">
				<label for="serialNumber" class="form-label small fw-semibold">Serial number</label>
				<input
					id="serialNumber"
					type="text"
					class="form-control"
					bind:value={createForm.serialNumber}
				/>
			</div>
		</div>
	</form>

	{#snippet footer()}
		<button
			type="button"
			class="btn btn-outline-secondary"
			onclick={() => (createModalOpen = false)}>Cancel</button
		>
		<button type="submit" form="asset-form" class="btn btn-primary" disabled={submitting}>
			{#if submitting}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Save
		</button>
	{/snippet}
</Modal>

<Modal
	open={assignModalOpen}
	title="Assign {assigningAsset?.name ?? 'Asset'}"
	onClose={() => (assignModalOpen = false)}
>
	<form id="assign-form" onsubmit={handleAssignSubmit}>
		<label for="assignEmployee" class="form-label small fw-semibold">Employee</label>
		<select id="assignEmployee" class="form-select" bind:value={assignEmployeeId} required>
			<option value="" disabled>Select an employee</option>
			{#each employees as employee (employee.id)}
				<option value={employee.id}
					>{employee.firstName} {employee.lastName} ({employee.employeeCode})</option
				>
			{/each}
		</select>
	</form>

	{#snippet footer()}
		<button
			type="button"
			class="btn btn-outline-secondary"
			onclick={() => (assignModalOpen = false)}>Cancel</button
		>
		<button type="submit" form="assign-form" class="btn btn-primary" disabled={submitting}>
			{#if submitting}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Assign
		</button>
	{/snippet}
</Modal>
