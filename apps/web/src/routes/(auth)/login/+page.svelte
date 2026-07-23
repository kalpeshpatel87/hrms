<script lang="ts">
	import { goto } from '$app/navigation';
	import { login } from '../../../lib/features/auth/api.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { toasts } from '../../../lib/stores/toast.js';

	let email = $state('');
	let password = $state('');
	let submitting = $state(false);
	let errorMessage = $state('');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		errorMessage = '';
		try {
			const user = await login(email, password);
			toasts.success('Welcome back', `Signed in as ${user.email}`);
			if (user.mustChangePassword) {
				toasts.warning('Please change your password', 'You are using a temporary password.');
			}
			await goto('/dashboard');
		} catch (err) {
			errorMessage = extractErrorMessage(err);
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Sign in — Atyantik EMS</title>
</svelte:head>

<form onsubmit={handleSubmit} novalidate>
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
			autocomplete="username"
			bind:value={email}
			required
			placeholder="you@atyantik.com"
		/>
	</div>

	<div class="mb-3">
		<div class="d-flex justify-content-between">
			<label for="password" class="form-label small fw-semibold">Password</label>
			<a href="/forgot-password" class="small">Forgot password?</a>
		</div>
		<input
			id="password"
			name="password"
			type="password"
			class="form-control"
			autocomplete="current-password"
			bind:value={password}
			required
		/>
	</div>

	<button type="submit" class="btn btn-primary w-100" disabled={submitting}>
		{#if submitting}
			<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
		{/if}
		Sign in
	</button>
</form>
