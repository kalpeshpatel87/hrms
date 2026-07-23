<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { logout } from '../../features/auth/api.js';
	import { getUnreadCount } from '../../features/notification/api.js';
	import { currentUser } from '../../stores/auth.js';
	import { mobileSidebarOpen, sidebarCollapsed } from '../../stores/sidebar.js';
	import { theme } from '../../stores/theme.js';
	import CommandPalette from './CommandPalette.svelte';

	let unreadCount = $state(0);

	onMount(() => {
		const refresh = () => {
			getUnreadCount()
				.then((count) => (unreadCount = count))
				.catch(() => undefined);
		};
		refresh();
		const interval = setInterval(refresh, 60_000);
		return () => clearInterval(interval);
	});

	const crumbs = $derived(
		page.url.pathname
			.split('/')
			.filter(Boolean)
			.map((segment, index, arr) => ({
				label: segment.replace(/-/g, ' '),
				href: '/' + arr.slice(0, index + 1).join('/')
			}))
	);

	async function handleLogout() {
		await logout();
		await goto('/login');
	}

	function toggleTheme() {
		theme.set($theme === 'dark' ? 'light' : 'dark');
	}
</script>

<header class="app-topbar">
	<button
		type="button"
		class="btn btn-sm btn-light border d-lg-none"
		aria-label="Toggle navigation"
		onclick={() => mobileSidebarOpen.set(!$mobileSidebarOpen)}
	>
		<i class="bi bi-list"></i>
	</button>

	<button
		type="button"
		class="btn btn-sm btn-light border d-none d-lg-inline-flex"
		aria-label="Collapse navigation"
		onclick={() => sidebarCollapsed.toggle()}
	>
		<i class="bi bi-layout-sidebar-inset"></i>
	</button>

	<nav aria-label="Breadcrumb" class="d-none d-md-block">
		<ol class="breadcrumb mb-0">
			<li class="breadcrumb-item"><a href="/dashboard">Home</a></li>
			{#each crumbs as crumb, i (crumb.href)}
				{#if i > 0}
					<li class="breadcrumb-item text-capitalize" class:active={i === crumbs.length - 1}>
						{#if i === crumbs.length - 1}
							{crumb.label}
						{:else}
							<a href={crumb.href}>{crumb.label}</a>
						{/if}
					</li>
				{/if}
			{/each}
		</ol>
	</nav>

	<div class="ms-auto d-flex align-items-center gap-2">
		<CommandPalette />

		<button
			type="button"
			class="btn btn-sm btn-light border"
			aria-label="Toggle theme"
			onclick={toggleTheme}
		>
			<i class="bi {$theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'}"></i>
		</button>

		<a
			href="/notifications"
			class="btn btn-sm btn-light border position-relative"
			aria-label="Notifications ({unreadCount} unread)"
		>
			<i class="bi bi-bell"></i>
			{#if unreadCount > 0}
				<span
					class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
					style="font-size: 0.6rem;"
				>
					{unreadCount > 9 ? '9+' : unreadCount}
				</span>
			{/if}
		</a>

		<div class="dropdown">
			<button
				type="button"
				class="btn btn-sm btn-light border d-flex align-items-center gap-2"
				data-bs-toggle="dropdown"
				aria-expanded="false"
			>
				<span class="fw-semibold small">
					{$currentUser?.employee
						? `${$currentUser.employee.firstName} ${$currentUser.employee.lastName}`
						: $currentUser?.email}
				</span>
				<i class="bi bi-chevron-down small"></i>
			</button>
			<ul class="dropdown-menu dropdown-menu-end shadow-sm">
				<li>
					<a class="dropdown-item" href="/profile"><i class="bi bi-person me-2"></i>My Profile</a>
				</li>
				<li>
					<a class="dropdown-item" href="/settings"><i class="bi bi-gear me-2"></i>Settings</a>
				</li>
				<li><hr class="dropdown-divider" /></li>
				<li>
					<button type="button" class="dropdown-item text-danger" onclick={handleLogout}>
						<i class="bi bi-box-arrow-right me-2"></i>Sign out
					</button>
				</li>
			</ul>
		</div>
	</div>
</header>
