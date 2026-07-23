<script lang="ts">
	let { children } = $props();
</script>

<div class="auth-shell d-flex align-items-center justify-content-center min-vh-100 p-3">
	<div class="auth-card glass-card p-4 p-md-5">
		<div class="text-center mb-4">
			<div class="auth-brand-mark mx-auto mb-3">A</div>
			<h1 class="h4 fw-bold mb-1">Atyantik EMS</h1>
			<p class="text-muted-2 small mb-0">Atyantik Technologies Pvt. Ltd.</p>
		</div>
		{@render children()}
	</div>
</div>

<style lang="scss">
	.auth-shell {
		background:
			radial-gradient(circle at 15% 20%, rgba(36, 82, 184, 0.12), transparent 45%),
			radial-gradient(circle at 85% 80%, rgba(36, 82, 184, 0.1), transparent 45%),
			var(--surface-muted);
	}

	.auth-card {
		width: 100%;
		max-width: 420px;
	}

	.auth-brand-mark {
		width: 52px;
		height: 52px;
		border-radius: 0.85rem;
		background: linear-gradient(135deg, #2452b8, #4d7ff0);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 800;
		font-size: 1.4rem;
	}
</style>
