<script lang="ts">
	import { changePassword } from '../../../lib/features/auth/api.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { toasts } from '../../../lib/stores/toast.js';

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let saving = $state(false);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (newPassword !== confirmPassword) {
			toasts.error('Passwords do not match', 'New password and confirmation must match.');
			return;
		}
		saving = true;
		try {
			await changePassword(currentPassword, newPassword);
			toasts.success('Password changed successfully');
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		} catch (err) {
			toasts.error('Could not change password', extractErrorMessage(err));
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Settings — Atyantik EMS</title>
</svelte:head>

<div class="mb-3">
	<h1 class="h4 fw-bold mb-1">Settings</h1>
	<p class="text-muted-2 mb-0">Manage your account security.</p>
</div>

<div class="card border-0 shadow-sm" style="max-width: 480px;">
	<div class="card-body">
		<h2 class="h6 fw-bold mb-3">Change password</h2>
		<form onsubmit={handleSubmit}>
			<div class="mb-3">
				<label for="currentPassword" class="form-label small fw-semibold">Current password</label
				>
				<input
					id="currentPassword"
					type="password"
					class="form-control"
					bind:value={currentPassword}
					required
				/>
			</div>
			<div class="mb-3">
				<label for="newPassword" class="form-label small fw-semibold">New password</label>
				<input
					id="newPassword"
					type="password"
					class="form-control"
					bind:value={newPassword}
					required
				/>
				<div class="form-text">
					At least 10 characters, with an uppercase letter, lowercase letter, digit, and special
					character.
				</div>
			</div>
			<div class="mb-3">
				<label for="confirmPassword" class="form-label small fw-semibold"
					>Confirm new password</label
				>
				<input
					id="confirmPassword"
					type="password"
					class="form-control"
					bind:value={confirmPassword}
					required
				/>
			</div>
			<button type="submit" class="btn btn-primary" disabled={saving}>
				{#if saving}
					<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"
					></span>
				{/if}
				Update password
			</button>
		</form>
	</div>
</div>
