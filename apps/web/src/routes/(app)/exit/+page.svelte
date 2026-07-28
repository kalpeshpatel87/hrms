<script lang="ts">
	import { onMount } from 'svelte';
	import EmptyState from '../../../lib/components/ui/EmptyState.svelte';
	import Modal from '../../../lib/components/ui/Modal.svelte';
	import StatusBadge from '../../../lib/components/ui/StatusBadge.svelte';
	import {
		createResignation,
		createResignationForAdmin,
		listMyResignations
	} from '../../../lib/features/exit/api.js';
	import type { CreateResignationInput, Resignation } from '../../../lib/features/exit/types.js';
	import { listEmployees } from '../../../lib/features/employee/api.js';
	import type { EmployeeListItem } from '../../../lib/features/employee/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { hasPermission } from '../../../lib/stores/auth.js';
	import { toasts } from '../../../lib/stores/toast.js';

	const canSubmitForOthers = hasPermission('exit:create');

	let resignations = $state<Resignation[]>([]);
	let employees = $state<EmployeeListItem[]>([]);
	let loading = $state(true);
	let modalOpen = $state(false);
	let modalMode = $state<'self' | 'admin'>('self');
	let onBehalfOfEmployeeId = $state('');
	let submitting = $state(false);
	let form = $state<CreateResignationInput>({
		resignationDate: new Date().toISOString().slice(0, 10),
		lastWorkingDate: new Date().toISOString().slice(0, 10),
		reason: ''
	});

	async function load() {
		loading = true;
		const tasks: Promise<unknown>[] = [
			listMyResignations({ page: 1, pageSize: 20 })
				.then((result) => {
					resignations = result.items;
				})
				.catch((err) => {
					toasts.error('Could not load resignation history', extractErrorMessage(err));
				})
		];
		if (canSubmitForOthers) {
			tasks.push(
				listEmployees({ page: 1, pageSize: 100 })
					.then((result) => {
						employees = result.items;
					})
					.catch((err) => {
						toasts.error('Could not load employee list', extractErrorMessage(err));
					})
			);
		}
		await Promise.all(tasks);
		loading = false;
	}

	onMount(load);

	function openModal(mode: 'self' | 'admin') {
		modalMode = mode;
		onBehalfOfEmployeeId = '';
		form = {
			resignationDate: new Date().toISOString().slice(0, 10),
			lastWorkingDate: new Date().toISOString().slice(0, 10),
			reason: ''
		};
		modalOpen = true;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		try {
			if (modalMode === 'admin') {
				await createResignationForAdmin({ ...form, employeeId: onBehalfOfEmployeeId });
				toasts.success('Resignation submitted on behalf of the employee');
			} else {
				await createResignation(form);
				toasts.success('Resignation submitted');
			}
			modalOpen = false;
			await load();
		} catch (err) {
			toasts.error('Could not submit resignation', extractErrorMessage(err));
		} finally {
			submitting = false;
		}
	}

	const hasActiveResignation = $derived(
		resignations.some((r) => r.status === 'SUBMITTED' || r.status === 'NOTICE_PERIOD')
	);
</script>

<svelte:head>
	<title>Exit Management — Atyantik EMS</title>
</svelte:head>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
	<div>
		<h1 class="h4 fw-bold mb-1">Exit Management</h1>
		<p class="text-muted-2 mb-0">Submit and track your resignation.</p>
	</div>
	<div class="d-flex gap-2">
		{#if canSubmitForOthers}
			<button
				type="button"
				class="btn btn-outline-primary btn-sm"
				onclick={() => openModal('admin')}
			>
				<i class="bi bi-person-x me-1"></i>Submit Resignation on Behalf of Employee
			</button>
		{/if}
		{#if !hasActiveResignation}
			<button type="button" class="btn btn-primary btn-sm" onclick={() => openModal('self')}>
				<i class="bi bi-box-arrow-right me-1"></i>Submit Resignation
			</button>
		{/if}
	</div>
</div>

{#if loading}
	<div class="skeleton" style="height: 200px;"></div>
{:else if resignations.length === 0}
	<EmptyState icon="bi-box-arrow-right" title="No resignation on file" />
{:else}
	<div class="d-flex flex-column gap-3">
		{#each resignations as resignation (resignation.id)}
			<div class="card border-0 shadow-sm">
				<div class="card-body">
					<div class="d-flex justify-content-between align-items-start mb-2">
						<div>
							<div class="text-muted-2 small">
								Submitted {new Date(resignation.createdAt).toLocaleDateString()}
							</div>
							<div class="fw-semibold">
								Last working day: {new Date(resignation.lastWorkingDate).toLocaleDateString()}
							</div>
						</div>
						<StatusBadge status={resignation.status} />
					</div>
					{#if resignation.reason}
						<p class="mb-2 small">{resignation.reason}</p>
					{/if}
					{#if resignation.exitChecklist}
						<div class="border-top pt-2">
							<div class="small fw-semibold mb-1">Exit checklist</div>
							<ul class="list-unstyled mb-0 small">
								{#each resignation.exitChecklist.tasks as task (task.id)}
									<li class="d-flex align-items-center gap-2">
										<i
											class="bi {task.status === 'COMPLETED'
												? 'bi-check-circle-fill text-success'
												: 'bi-circle text-muted-2'}"
										></i>
										{task.taskName}
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}

<Modal
	open={modalOpen}
	title={modalMode === 'admin' ? 'Submit Resignation on Behalf of Employee' : 'Submit Resignation'}
	onClose={() => (modalOpen = false)}
>
	<form id="resignation-form" onsubmit={handleSubmit}>
		{#if modalMode === 'admin'}
			<div class="mb-3">
				<label for="onBehalfOf" class="form-label small fw-semibold">Employee</label>
				<select id="onBehalfOf" class="form-select" bind:value={onBehalfOfEmployeeId} required>
					<option value="" disabled>Select an employee</option>
					{#each employees as employee (employee.id)}
						<option value={employee.id}
							>{employee.firstName} {employee.lastName} ({employee.employeeCode})</option
						>
					{/each}
				</select>
			</div>
		{/if}
		<div class="row g-3 mb-3">
			<div class="col-6">
				<label for="resignationDate" class="form-label small fw-semibold">Resignation date</label>
				<input
					id="resignationDate"
					type="date"
					class="form-control"
					bind:value={form.resignationDate}
					required
				/>
			</div>
			<div class="col-6">
				<label for="lastWorkingDate" class="form-label small fw-semibold">Last working date</label>
				<input
					id="lastWorkingDate"
					type="date"
					class="form-control"
					bind:value={form.lastWorkingDate}
					required
				/>
			</div>
		</div>
		<div class="mb-0">
			<label for="reason" class="form-label small fw-semibold">Reason (optional)</label>
			<textarea id="reason" class="form-control" rows="3" bind:value={form.reason}></textarea>
		</div>
	</form>

	{#snippet footer()}
		<button type="button" class="btn btn-outline-secondary" onclick={() => (modalOpen = false)}
			>Cancel</button
		>
		<button type="submit" form="resignation-form" class="btn btn-primary" disabled={submitting}>
			{#if submitting}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Submit
		</button>
	{/snippet}
</Modal>
