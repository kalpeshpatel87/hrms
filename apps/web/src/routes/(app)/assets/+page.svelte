<script lang="ts">
	import { onMount } from 'svelte';
	import EmptyState from '../../../lib/components/ui/EmptyState.svelte';
	import { listMyAssets } from '../../../lib/features/asset/api.js';
	import type { AssetAssignment } from '../../../lib/features/asset/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { toasts } from '../../../lib/stores/toast.js';

	let assignments = $state<AssetAssignment[]>([]);
	let loading = $state(true);

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

	onMount(async () => {
		try {
			assignments = await listMyAssets();
		} catch (err) {
			toasts.error('Could not load your assets', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Assets — Atyantik EMS</title>
</svelte:head>

<div class="mb-3">
	<h1 class="h4 fw-bold mb-1">My Assets</h1>
	<p class="text-muted-2 mb-0">Company equipment currently assigned to you.</p>
</div>

{#if loading}
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
