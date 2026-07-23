<script lang="ts">
	interface Props {
		label: string;
		value: string | number;
		icon?: string;
		variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
		loading?: boolean;
	}

	let {
		label,
		value,
		icon = 'bi-graph-up',
		variant = 'primary',
		loading = false
	}: Props = $props();
</script>

<div class="stat-card">
	<div class="d-flex align-items-start justify-content-between">
		<span class="stat-card-label">{label}</span>
		<span class="stat-card-icon bg-{variant}-subtle text-{variant}">
			<i class="bi {icon}"></i>
		</span>
	</div>
	{#if loading}
		<div class="skeleton" style="height: 1.75rem; width: 60%;"></div>
	{:else}
		<span class="stat-card-value">{value}</span>
	{/if}
</div>

<style lang="scss">
	.stat-card-icon {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.6rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
</style>
