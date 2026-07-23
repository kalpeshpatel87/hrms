<script lang="ts">
	import { onMount } from 'svelte';
	import EmptyState from '../../../lib/components/ui/EmptyState.svelte';
	import Modal from '../../../lib/components/ui/Modal.svelte';
	import StatusBadge from '../../../lib/components/ui/StatusBadge.svelte';
	import { createResignation, listMyResignations } from '../../../lib/features/exit/api.js';
	import type { CreateResignationInput, Resignation } from '../../../lib/features/exit/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { toasts } from '../../../lib/stores/toast.js';

	let resignations = $state<Resignation[]>([]);
	let loading = $state(true);
	let modalOpen = $state(false);
	let submitting = $state(false);
	let form = $state<CreateResignationInput>({
		resignationDate: new Date().toISOString().slice(0, 10),
		lastWorkingDate: new Date().toISOString().slice(0, 10),
		reason: ''
	});

	async function load() {
		loading = true;
		try {
			const result = await listMyResignations({ page: 1, pageSize: 20 });
			resignations = result.items;
		} catch (err) {
			toasts.error('Could not load resignation history', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		try {
			await createResignation(form);
			toasts.success('Resignation submitted');
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
	{#if !hasActiveResignation}
		<button type="button" class="btn btn-primary btn-sm" onclick={() => (modalOpen = true)}>
			<i class="bi bi-box-arrow-right me-1"></i>Submit Resignation
		</button>
	{/if}
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

<Modal open={modalOpen} title="Submit Resignation" onClose={() => (modalOpen = false)}>
	<form id="resignation-form" onsubmit={handleSubmit}>
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
