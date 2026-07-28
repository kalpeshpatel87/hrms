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
		// Bootstrap's data-bs-* attributes (the Topbar user-menu dropdown, any
		// future offcanvas/tooltip) need its JS bundle — only the SCSS was
		// imported, so those components rendered inert (clicks did nothing).
		// The subpath has no bundled type declarations, hence the suppression.
		// @ts-expect-error -- no .d.ts for this subpath, side-effect import only
		void import('bootstrap/dist/js/bootstrap.bundle.min.js');
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<ToastContainer />
