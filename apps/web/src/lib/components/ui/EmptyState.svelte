<script lang="ts">
	interface Props {
		icon?: string;
		title: string;
		message?: string;
	}

	let { icon = 'bi-inbox', title, message }: Props = $props();
</script>

<div class="empty-state text-center py-5">
	<i class="bi {icon} display-6 text-muted-2 d-block mb-2"></i>
	<div class="fw-semibold">{title}</div>
	{#if message}
		<div class="text-muted-2 small">{message}</div>
	{/if}
</div>
