<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { NAV_SECTIONS } from '../../navigation.js';
	import { hasPermission } from '../../stores/auth.js';

	let open = $state(false);
	let query = $state('');
	let activeIndex = $state(0);
	let inputEl: HTMLInputElement | undefined = $state();

	const allItems = NAV_SECTIONS.flatMap((section) =>
		section.items
			.filter((item) => !item.permission || hasPermission(item.permission))
			.map((item) => ({ ...item, section: section.label }))
	);

	const filtered = $derived(
		query.trim().length === 0
			? allItems
			: allItems.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))
	);

	function openPalette() {
		open = true;
		query = '';
		activeIndex = 0;
		queueMicrotask(() => inputEl?.focus());
	}

	function closePalette() {
		open = false;
	}

	function select(href: string) {
		closePalette();
		void goto(href);
	}

	function onKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			if (open) {
				closePalette();
			} else {
				openPalette();
			}
			return;
		}
		if (!open) return;
		if (event.key === 'Escape') closePalette();
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
		}
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
		}
		if (event.key === 'Enter' && filtered[activeIndex]) {
			select(filtered[activeIndex].href);
		}
	}

	onMount(() => {
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});
</script>

<button
	type="button"
	class="btn btn-sm btn-light border d-flex align-items-center gap-2"
	onclick={openPalette}
>
	<i class="bi bi-search"></i>
	<span class="d-none d-md-inline text-muted-2">Search…</span>
	<kbd class="d-none d-md-inline small">Ctrl K</kbd>
</button>

{#if open}
	<div
		class="command-palette-backdrop"
		onclick={closePalette}
		onkeydown={(e) => e.key === 'Escape' && closePalette()}
		role="presentation"
	>
		<div
			class="command-palette glass-card"
			role="dialog"
			aria-modal="true"
			aria-label="Command palette"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="p-2 border-bottom">
				<input
					bind:this={inputEl}
					bind:value={query}
					type="text"
					class="form-control form-control-lg border-0 shadow-none"
					placeholder="Jump to a module or page…"
				/>
			</div>
			<ul class="list-unstyled m-0 command-palette-list">
				{#each filtered as item, i (item.href)}
					<li>
						<button
							type="button"
							class="command-palette-item"
							class:is-active={i === activeIndex}
							onmouseenter={() => (activeIndex = i)}
							onclick={() => select(item.href)}
						>
							<i class="bi {item.icon}"></i>
							<span>{item.label}</span>
							<span class="ms-auto text-muted-2 small">{item.section}</span>
						</button>
					</li>
				{:else}
					<li class="text-center text-muted-2 py-4">No matches</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}

<style lang="scss">
	.command-palette-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(10, 14, 24, 0.45);
		z-index: 1050;
		display: flex;
		justify-content: center;
		padding-top: 12vh;
	}

	.command-palette {
		width: min(560px, 92vw);
		max-height: 60vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.command-palette-list {
		overflow-y: auto;
		padding: 0.4rem;
	}

	.command-palette-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.65rem;
		border: none;
		background: transparent;
		padding: 0.55rem 0.65rem;
		border-radius: 0.5rem;
		text-align: start;
		color: var(--text-primary);

		&.is-active {
			background: var(--surface-sunken);
		}
	}
</style>
