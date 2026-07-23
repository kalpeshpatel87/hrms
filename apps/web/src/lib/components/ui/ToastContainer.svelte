<script lang="ts">
	import { toasts, type ToastVariant } from '../../stores/toast.js';

	const iconFor: Record<ToastVariant, string> = {
		success: 'bi-check-circle-fill',
		danger: 'bi-exclamation-octagon-fill',
		warning: 'bi-exclamation-triangle-fill',
		info: 'bi-info-circle-fill'
	};
</script>

<div
	class="toast-stack position-fixed top-0 end-0 p-3"
	style="z-index: 1080;"
	aria-live="polite"
	aria-atomic="true"
>
	{#each $toasts as toast (toast.id)}
		<div class="toast show align-items-center border-0 text-bg-{toast.variant} mb-2" role="alert">
			<div class="d-flex">
				<div class="toast-body d-flex align-items-start gap-2">
					<i class="bi {iconFor[toast.variant]} mt-1"></i>
					<div>
						<div class="fw-semibold">{toast.title}</div>
						{#if toast.message}
							<div class="small opacity-90">{toast.message}</div>
						{/if}
					</div>
				</div>
				<button
					type="button"
					class="btn-close btn-close-white me-2 m-auto"
					aria-label="Close"
					onclick={() => toasts.dismiss(toast.id)}
				></button>
			</div>
		</div>
	{/each}
</div>

<style lang="scss">
	.toast-stack {
		max-width: 380px;
	}
</style>
