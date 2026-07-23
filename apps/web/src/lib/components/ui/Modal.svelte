<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		onClose: () => void;
		children?: Snippet;
		footer?: Snippet;
	}

	let { open, title, size = 'md', onClose, children, footer }: Props = $props();

	const sizeClass = $derived({ sm: 'modal-sm', md: '', lg: 'modal-lg', xl: 'modal-xl' }[size]);

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={open ? onKeydown : undefined} />

{#if open}
	<div class="modal-backdrop-custom" onclick={onClose} role="presentation"></div>
	<div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" aria-label={title}>
		<div class="modal-dialog modal-dialog-centered {sizeClass}">
			<div class="modal-content">
				<div class="modal-header">
					<h2 class="modal-title h5">{title}</h2>
					<button type="button" class="btn-close" aria-label="Close" onclick={onClose}></button>
				</div>
				<div class="modal-body">
					{@render children?.()}
				</div>
				{#if footer}
					<div class="modal-footer">
						{@render footer()}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop-custom {
		position: fixed;
		inset: 0;
		background: rgba(10, 14, 24, 0.5);
		z-index: 1050;
	}

	.modal {
		z-index: 1055;
	}
</style>
