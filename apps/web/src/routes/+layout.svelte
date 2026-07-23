<script lang="ts">
	import '../lib/styles/app.scss';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import ToastContainer from '../lib/components/ui/ToastContainer.svelte';
	import { direction, theme } from '../lib/stores/theme.js';

	let { children } = $props();

	onMount(() => {
		theme.init();
		direction.init();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<ToastContainer />
