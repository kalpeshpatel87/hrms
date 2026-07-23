<script lang="ts">
	import { forgotPassword } from '../../../lib/features/auth/api.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';

	let email = $state('');
	let submitting = $state(false);
	let submitted = $state(false);
	let errorMessage = $state('');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		errorMessage = '';
		try {
			await forgotPassword(email);
			submitted = true;
		} catch (err) {
			errorMessage = extractErrorMessage(err);
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Forgot password — Atyantik EMS</title>
</svelte:head>

{#if submitted}
	<div class="alert alert-success small" role="status">
		If an account exists for that email, a reset link has been sent.
	</div>
	<a href="/login" class="btn btn-outline-secondary w-100">Back to sign in</a>
{:else}
	<form onsubmit={handleSubmit} novalidate>
		<p class="text-muted-2 small mb-3">
			Enter your work email and we'll send you a link to reset your password.
		</p>

		{#if errorMessage}
			<div class="alert alert-danger py-2 small" role="alert">{errorMessage}</div>
		{/if}

		<div class="mb-3">
			<label for="email" class="form-label small fw-semibold">Work email</label>
			<input
				id="email"
				name="email"
				type="email"
				class="form-control"
				bind:value={email}
				required
			/>
		</div>

		<button type="submit" class="btn btn-primary w-100" disabled={submitting}>
			{#if submitting}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Send reset link
		</button>
		<a href="/login" class="btn btn-link w-100 mt-2">Back to sign in</a>
	</form>
{/if}
