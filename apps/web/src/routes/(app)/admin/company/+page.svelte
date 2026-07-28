<script lang="ts">
	import { onMount } from 'svelte';
	import { getCompany, updateCompany } from '../../../../lib/features/admin/api.js';
	import type { Company } from '../../../../lib/features/admin/types.js';
	import { extractErrorMessage } from '../../../../lib/services/api-client.js';
	import { toasts } from '../../../../lib/stores/toast.js';

	let loading = $state(true);
	let saving = $state(false);
	let form = $state<Company | null>(null);

	async function load() {
		loading = true;
		try {
			form = await getCompany();
		} catch (err) {
			toasts.error('Could not load company details', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!form) return;
		saving = true;
		try {
			form = await updateCompany(form);
			toasts.success('Company details updated');
		} catch (err) {
			toasts.error('Could not update company details', extractErrorMessage(err));
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Company Setup — Atyantik EMS</title>
</svelte:head>

<div class="mb-3">
	<h1 class="h4 fw-bold mb-1">Company Setup</h1>
	<p class="text-muted-2 mb-0">Manage your organization's registered details.</p>
</div>

{#if loading || !form}
	<div class="skeleton" style="height: 320px;"></div>
{:else}
	<div class="card border-0 shadow-sm">
		<div class="card-body">
			<form onsubmit={handleSubmit}>
				<div class="row g-3">
					<div class="col-md-6">
						<label for="name" class="form-label small fw-semibold">Company name</label>
						<input id="name" type="text" class="form-control" bind:value={form.name} required />
					</div>
					<div class="col-md-6">
						<label for="legalName" class="form-label small fw-semibold">Legal name</label>
						<input id="legalName" type="text" class="form-control" bind:value={form.legalName} />
					</div>
					<div class="col-md-6">
						<label for="cin" class="form-label small fw-semibold">CIN</label>
						<input id="cin" type="text" class="form-control" bind:value={form.cin} />
					</div>
					<div class="col-md-6">
						<label for="gstin" class="form-label small fw-semibold">GSTIN</label>
						<input id="gstin" type="text" class="form-control" bind:value={form.gstin} />
					</div>
					<div class="col-12">
						<label for="addressLine1" class="form-label small fw-semibold">Address line 1</label>
						<input
							id="addressLine1"
							type="text"
							class="form-control"
							bind:value={form.addressLine1}
						/>
					</div>
					<div class="col-12">
						<label for="addressLine2" class="form-label small fw-semibold">Address line 2</label>
						<input
							id="addressLine2"
							type="text"
							class="form-control"
							bind:value={form.addressLine2}
						/>
					</div>
					<div class="col-md-3">
						<label for="city" class="form-label small fw-semibold">City</label>
						<input id="city" type="text" class="form-control" bind:value={form.city} />
					</div>
					<div class="col-md-3">
						<label for="state" class="form-label small fw-semibold">State</label>
						<input id="state" type="text" class="form-control" bind:value={form.state} />
					</div>
					<div class="col-md-3">
						<label for="postalCode" class="form-label small fw-semibold">Postal code</label>
						<input id="postalCode" type="text" class="form-control" bind:value={form.postalCode} />
					</div>
					<div class="col-md-3">
						<label for="country" class="form-label small fw-semibold">Country</label>
						<input id="country" type="text" class="form-control" bind:value={form.country} />
					</div>
					<div class="col-md-6">
						<label for="timezone" class="form-label small fw-semibold">Timezone</label>
						<input
							id="timezone"
							type="text"
							class="form-control"
							bind:value={form.timezone}
							required
						/>
					</div>
					<div class="col-md-6">
						<label for="defaultCurrency" class="form-label small fw-semibold"
							>Default currency</label
						>
						<input
							id="defaultCurrency"
							type="text"
							class="form-control"
							bind:value={form.defaultCurrency}
							required
						/>
					</div>
				</div>

				<div class="mt-4 d-flex justify-content-end">
					<button type="submit" class="btn btn-primary" disabled={saving}>
						{#if saving}
							<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"
							></span>
						{/if}
						Save changes
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
