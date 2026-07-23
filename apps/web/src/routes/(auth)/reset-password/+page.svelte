<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resetPassword } from '../../../lib/features/auth/api.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { toasts } from '../../../lib/stores/toast.js';

	const token = $derived(page.url.searchParams.get('token') ?? '');

	let newPassword = $state('');
	let confirmPassword = $state('');
	let submitting = $state(false);
	let errorMessage = $state('');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = '';

		if (newPassword !== confirmPassword) {
			errorMessage = 'Passwords do not match.';
			return;
		}
		if (!token) {
			errorMessage = 'This reset link is missing its token.';
			return;
		}

		submitting = true;
		try {
			await resetPassword(token, newPassword);
			toasts.success('Password reset', 'You can now sign in with your new password.');
			await goto('/login');
		} catch (err) {
			errorMessage = extractErrorMessage(err);
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Reset password — Atyantik EMS</title>
</svelte:head>

<form onsubmit={handleSubmit} novalidate>
	{#if errorMessage}
		<div class="alert alert-danger py-2 small" role="alert">{errorMessage}</div>
	{/if}

	<div class="mb-3">
		<label for="newPassword" class="form-label small fw-semibold">New password</label>
		<input
			id="newPassword"
			type="password"
			class="form-control"
			autocomplete="new-password"
			bind:value={newPassword}
			minlength="10"
			required
		/>
		<div class="form-text">
			At least 10 characters, with upper/lowercase, a digit, and a special character.
		</div>
	</div>

	<div class="mb-3">
		<label for="confirmPassword" class="form-label small fw-semibold">Confirm new password</label>
		<input
			id="confirmPassword"
			type="password"
			class="form-control"
			autocomplete="new-password"
			bind:value={confirmPassword}
			required
		/>
	</div>

	<button type="submit" class="btn btn-primary w-100" disabled={submitting}>
		{#if submitting}
			<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
		{/if}
		Reset password
	</button>
</form>
