<script lang="ts">
	import { onMount } from 'svelte';
	import EmptyState from '../../../lib/components/ui/EmptyState.svelte';
	import Modal from '../../../lib/components/ui/Modal.svelte';
	import { createGoal, listMyGoals, updateGoal } from '../../../lib/features/performance/api.js';
	import type { CreateGoalInput, Goal } from '../../../lib/features/performance/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { toasts } from '../../../lib/stores/toast.js';

	let goals = $state<Goal[]>([]);
	let loading = $state(true);
	let modalOpen = $state(false);
	let submitting = $state(false);
	let form = $state<CreateGoalInput>({
		title: '',
		description: '',
		startDate: new Date().toISOString().slice(0, 10),
		dueDate: new Date().toISOString().slice(0, 10),
		weightPercent: 0
	});

	async function load() {
		loading = true;
		try {
			const result = await listMyGoals({ page: 1, pageSize: 50 });
			goals = result.items;
		} catch (err) {
			toasts.error('Could not load goals', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		try {
			await createGoal(form);
			toasts.success('Goal created');
			modalOpen = false;
			form = {
				title: '',
				description: '',
				startDate: new Date().toISOString().slice(0, 10),
				dueDate: new Date().toISOString().slice(0, 10),
				weightPercent: 0
			};
			await load();
		} catch (err) {
			toasts.error('Could not create goal', extractErrorMessage(err));
		} finally {
			submitting = false;
		}
	}

	async function handleProgressChange(goal: Goal, progressPercent: number) {
		try {
			await updateGoal(goal.id, {
				progressPercent,
				status: progressPercent >= 100 ? 'COMPLETED' : 'IN_PROGRESS'
			});
			await load();
		} catch (err) {
			toasts.error('Could not update progress', extractErrorMessage(err));
		}
	}
</script>

<svelte:head>
	<title>Performance — Atyantik EMS</title>
</svelte:head>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
	<div>
		<h1 class="h4 fw-bold mb-1">My Goals</h1>
		<p class="text-muted-2 mb-0">Track your goals for this review cycle.</p>
	</div>
	<button type="button" class="btn btn-primary btn-sm" onclick={() => (modalOpen = true)}>
		<i class="bi bi-plus-lg me-1"></i>New Goal
	</button>
</div>

{#if loading}
	<div class="skeleton" style="height: 200px;"></div>
{:else if goals.length === 0}
	<EmptyState icon="bi-graph-up-arrow" title="No goals set yet" />
{:else}
	<div class="d-flex flex-column gap-3">
		{#each goals as goal (goal.id)}
			<div class="card border-0 shadow-sm">
				<div class="card-body">
					<div class="d-flex justify-content-between align-items-start mb-2">
						<div>
							<h2 class="h6 fw-bold mb-1">{goal.title}</h2>
							<p class="text-muted-2 small mb-0">{goal.description ?? ''}</p>
						</div>
						<span class="badge text-bg-light border"
							>{goal.status.replaceAll('_', ' ').toLowerCase()}</span
						>
					</div>
					<div class="d-flex align-items-center gap-2">
						<div class="progress flex-grow-1" style="height: 8px;">
							<div
								class="progress-bar"
								role="progressbar"
								style="width: {goal.progressPercent}%"
								aria-valuenow={goal.progressPercent}
								aria-valuemin="0"
								aria-valuemax="100"
							></div>
						</div>
						<span class="text-muted-2 small" style="min-width: 3rem;">{goal.progressPercent}%</span>
					</div>
					<input
						type="range"
						class="form-range mt-1"
						min="0"
						max="100"
						step="5"
						value={goal.progressPercent}
						onchange={(e) =>
							handleProgressChange(goal, Number((e.currentTarget as HTMLInputElement).value))}
					/>
					<div class="text-muted-2 small">
						Due {new Date(goal.dueDate).toLocaleDateString()} · Weight {goal.weightPercent}%
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}

<Modal open={modalOpen} title="New Goal" onClose={() => (modalOpen = false)}>
	<form id="goal-form" onsubmit={handleSubmit}>
		<div class="mb-3">
			<label for="title" class="form-label small fw-semibold">Title</label>
			<input id="title" type="text" class="form-control" bind:value={form.title} required />
		</div>
		<div class="mb-3">
			<label for="description" class="form-label small fw-semibold">Description</label>
			<textarea id="description" class="form-control" rows="3" bind:value={form.description}
			></textarea>
		</div>
		<div class="row g-3">
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
				<label for="dueDate" class="form-label small fw-semibold">Due date</label>
				<input id="dueDate" type="date" class="form-control" bind:value={form.dueDate} required />
			</div>
		</div>
	</form>

	{#snippet footer()}
		<button type="button" class="btn btn-outline-secondary" onclick={() => (modalOpen = false)}
			>Cancel</button
		>
		<button type="submit" form="goal-form" class="btn btn-primary" disabled={submitting}>
			{#if submitting}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Create goal
		</button>
	{/snippet}
</Modal>
