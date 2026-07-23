<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { ApexOptions } from 'apexcharts';

	interface Props {
		options: ApexOptions;
		height?: number | string;
	}

	let { options, height = 280 }: Props = $props();
	let container: HTMLDivElement | undefined = $state();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let chart: any;

	onMount(async () => {
		const { default: ApexCharts } = await import('apexcharts');
		if (!container) return;
		chart = new ApexCharts(container, { ...options, chart: { ...options.chart, height } });
		await chart.render();
	});

	$effect(() => {
		if (chart) {
			chart.updateOptions({ ...options, chart: { ...options.chart, height } });
		}
	});

	onDestroy(() => {
		chart?.destroy();
	});
</script>

<div bind:this={container}></div>
