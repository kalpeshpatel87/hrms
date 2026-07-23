<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Sidebar from '../../lib/components/layout/Sidebar.svelte';
	import Topbar from '../../lib/components/layout/Topbar.svelte';
	import { resumeSession } from '../../lib/features/auth/api.js';
	import { authStore } from '../../lib/stores/auth.js';
	import { sidebarCollapsed } from '../../lib/stores/sidebar.js';

	let { children } = $props();
	let checked = $state(false);

	onMount(async () => {
		if ($authStore.status !== 'authenticated') {
			const user = await resumeSession();
			if (!user) {
				await goto('/login');
				return;
			}
		}
		checked = true;
	});
</script>

{#if checked}
	<div class="app-shell">
		<Sidebar />
		<div class="app-main" class:ms-lg-0={$sidebarCollapsed}>
			<Topbar />
			<main class="app-content">
				{@render children()}
			</main>
		</div>
	</div>
{:else}
	<div class="d-flex align-items-center justify-content-center min-vh-100">
		<div class="spinner-border text-primary" role="status">
			<span class="visually-hidden">Loading…</span>
		</div>
	</div>
{/if}
