<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '../../../../lib/components/ui/DataTable.svelte';
	import Modal from '../../../../lib/components/ui/Modal.svelte';
	import { createProject, listProjects, updateProject } from '../../../../lib/features/timesheet/api.js';
	import type { CreateProjectInput, Project } from '../../../../lib/features/timesheet/types.js';
	import { extractErrorMessage } from '../../../../lib/services/api-client.js';
	import { toasts } from '../../../../lib/stores/toast.js';

	let loading = $state(true);
	let projects = $state<Project[]>([]);

	let modalOpen = $state(false);
	let editingId = $state<string | null>(null);
	let saving = $state(false);
	let form = $state<CreateProjectInput>({ name: '', code: '', status: 'PLANNING' });

	const columns: Column[] = [
		{ key: 'code', label: 'Code', width: '120px' },
		{ key: 'name', label: 'Name' },
		{ key: 'status', label: 'Status' }
	];

	async function load() {
		loading = true;
		try {
			projects = await listProjects();
		} catch (err) {
			toasts.error('Could not load projects', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function openCreateModal() {
		editingId = null;
		form = { name: '', code: '', status: 'PLANNING' };
		modalOpen = true;
	}

	function openEditModal(project: Project) {
		editingId = project.id;
		form = {
			name: project.name,
			code: project.code,
			status: project.status,
			startDate: project.startDate?.slice(0, 10),
			endDate: project.endDate?.slice(0, 10)
		};
		modalOpen = true;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		saving = true;
		try {
			if (editingId) {
				await updateProject(editingId, form);
				toasts.success('Project updated');
			} else {
				await createProject(form);
				toasts.success('Project created');
			}
			modalOpen = false;
			await load();
		} catch (err) {
			toasts.error(
				editingId ? 'Could not update project' : 'Could not create project',
				extractErrorMessage(err)
			);
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Projects — Atyantik EMS</title>
</svelte:head>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
	<div>
		<h1 class="h4 fw-bold mb-1">Projects</h1>
		<p class="text-muted-2 mb-0">Manage the projects employees can log time against.</p>
	</div>
	<button type="button" class="btn btn-primary btn-sm" onclick={openCreateModal}>
		<i class="bi bi-plus-lg me-1"></i>New Project
	</button>
</div>

<div class="card border-0 shadow-sm">
	<div class="card-body">
		<DataTable {columns} rows={projects} rowKey={(row) => row.id} {loading} searchable={false} emptyTitle="No projects yet">
			{#snippet rowActions(row)}
				<button type="button" class="btn btn-sm btn-outline-secondary" onclick={() => openEditModal(row)}>
					Edit
				</button>
			{/snippet}
		</DataTable>
	</div>
</div>

<Modal
	open={modalOpen}
	title={editingId ? 'Edit Project' : 'New Project'}
	onClose={() => (modalOpen = false)}
>
	<form id="project-form" onsubmit={handleSubmit}>
		<div class="row g-3 mb-3">
			<div class="col-6">
				<label for="name" class="form-label small fw-semibold">Name</label>
				<input id="name" type="text" class="form-control" bind:value={form.name} required />
			</div>
			<div class="col-6">
				<label for="code" class="form-label small fw-semibold">Code</label>
				<input id="code" type="text" class="form-control" bind:value={form.code} required />
			</div>
			<div class="col-6">
				<label for="status" class="form-label small fw-semibold">Status</label>
				<select id="status" class="form-select" bind:value={form.status}>
					<option value="PLANNING">Planning</option>
					<option value="ACTIVE">Active</option>
					<option value="ON_HOLD">On hold</option>
					<option value="COMPLETED">Completed</option>
					<option value="CANCELLED">Cancelled</option>
				</select>
			</div>
			<div class="col-6"></div>
			<div class="col-6">
				<label for="startDate" class="form-label small fw-semibold">Start date</label>
				<input id="startDate" type="date" class="form-control" bind:value={form.startDate} />
			</div>
			<div class="col-6">
				<label for="endDate" class="form-label small fw-semibold">End date</label>
				<input id="endDate" type="date" class="form-control" bind:value={form.endDate} />
			</div>
		</div>
	</form>

	{#snippet footer()}
		<button type="button" class="btn btn-outline-secondary" onclick={() => (modalOpen = false)}
			>Cancel</button
		>
		<button type="submit" form="project-form" class="btn btn-primary" disabled={saving}>
			{#if saving}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			{editingId ? 'Save changes' : 'Create project'}
		</button>
	{/snippet}
</Modal>
