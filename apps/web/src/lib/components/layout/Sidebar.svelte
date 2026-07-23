<script lang="ts">
	import { page } from '$app/state';
	import { NAV_SECTIONS } from '../../navigation.js';
	import { hasPermission } from '../../stores/auth.js';
	import { mobileSidebarOpen, sidebarCollapsed } from '../../stores/sidebar.js';

	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}

	function visibleItems(items: (typeof NAV_SECTIONS)[number]['items']) {
		return items.filter((item) => !item.permission || hasPermission(item.permission));
	}
</script>

<aside
	class="app-sidebar"
	class:is-collapsed={$sidebarCollapsed}
	class:is-mobile-open={$mobileSidebarOpen}
	aria-label="Primary"
>
	<a href="/dashboard" class="sidebar-brand" onclick={() => mobileSidebarOpen.set(false)}>
		<span class="sidebar-brand-mark">A</span>
		<span class="sidebar-brand-name">Atyantik EMS</span>
	</a>

	<nav class="sidebar-nav">
		{#each NAV_SECTIONS as section (section.label)}
			{@const items = visibleItems(section.items)}
			{#if items.length > 0}
				<div class="sidebar-section-label">{section.label}</div>
				{#each items as item (item.href)}
					<a
						href={item.href}
						class="sidebar-link"
						class:is-active={isActive(item.href)}
						onclick={() => mobileSidebarOpen.set(false)}
					>
						<i class="bi {item.icon}"></i>
						<span class="sidebar-link-label">{item.label}</span>
					</a>
				{/each}
			{/if}
		{/each}
	</nav>
</aside>

{#if $mobileSidebarOpen}
	<button
		type="button"
		class="position-fixed top-0 start-0 w-100 h-100 border-0 p-0"
		style="z-index: 39; background: rgba(0,0,0,0.35);"
		aria-label="Close navigation"
		onclick={() => mobileSidebarOpen.set(false)}
	></button>
{/if}
