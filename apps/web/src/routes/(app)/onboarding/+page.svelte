<script lang="ts">
	import { onMount } from 'svelte';
	import EmptyState from '../../../lib/components/ui/EmptyState.svelte';
	import { getMyEmployeeProfile } from '../../../lib/features/employee/api.js';
	import { getChecklistForEmployee } from '../../../lib/features/onboarding/api.js';
	import type { OnboardingChecklist } from '../../../lib/features/onboarding/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { toasts } from '../../../lib/stores/toast.js';

	let checklist = $state<OnboardingChecklist | null>(null);
	let loading = $state(true);
	let notFound = $state(false);

	const completedCount = $derived(
		checklist?.tasks.filter((t) => t.status === 'COMPLETED').length ?? 0
	);
	const progressPercent = $derived(
		checklist && checklist.tasks.length > 0
			? Math.round((completedCount / checklist.tasks.length) * 100)
			: 0
	);

	onMount(async () => {
		try {
			const employee = await getMyEmployeeProfile();
			checklist = await getChecklistForEmployee(employee.id);
		} catch (err) {
			const message = extractErrorMessage(err);
			if (message.toLowerCase().includes('not found')) {
				notFound = true;
			} else {
				toasts.error('Could not load onboarding checklist', message);
			}
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Onboarding — Atyantik EMS</title>
</svelte:head>

<div class="mb-3">
	<h1 class="h4 fw-bold mb-1">Onboarding</h1>
	<p class="text-muted-2 mb-0">Your onboarding checklist and progress.</p>
</div>

{#if loading}
	<div class="skeleton" style="height: 200px;"></div>
{:else if notFound || !checklist}
	<EmptyState icon="bi-door-open" title="No onboarding checklist has been created for you yet" />
{:else}
	<div class="card border-0 shadow-sm">
		<div class="card-body">
			<div class="d-flex justify-content-between align-items-center mb-2">
				<span class="fw-semibold">{checklist.templateName}</span>
				<span class="text-muted-2 small">{completedCount} / {checklist.tasks.length} complete</span>
			</div>
			<div class="progress mb-3" style="height: 8px;">
				<div
					class="progress-bar bg-success"
					role="progressbar"
					style="width: {progressPercent}%"
				></div>
			</div>
			<ul class="list-unstyled mb-0">
				{#each checklist.tasks as task (task.id)}
					<li class="d-flex align-items-center gap-2 py-2 border-bottom">
						<i
							class="bi {task.status === 'COMPLETED'
								? 'bi-check-circle-fill text-success'
								: task.status === 'SKIPPED'
									? 'bi-dash-circle text-muted-2'
									: 'bi-circle text-muted-2'}"
						></i>
						<span class:text-decoration-line-through={task.status === 'COMPLETED'}
							>{task.taskName}</span
						>
						{#if task.dueDate}
							<span class="text-muted-2 small ms-auto"
								>Due {new Date(task.dueDate).toLocaleDateString()}</span
							>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}
