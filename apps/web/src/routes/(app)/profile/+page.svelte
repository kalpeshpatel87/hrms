<script lang="ts">
	import { onMount } from 'svelte';
	import { getMyProfile, updateMyProfile } from '../../../lib/features/profile/api.js';
	import type { MyProfile } from '../../../lib/features/profile/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { toasts } from '../../../lib/stores/toast.js';

	let loading = $state(true);
	let saving = $state(false);
	let profile = $state<MyProfile | null>(null);
	let dobInput = $state('');

	async function load() {
		loading = true;
		try {
			profile = await getMyProfile();
			dobInput = profile.dateOfBirth?.slice(0, 10) ?? '';
		} catch (err) {
			toasts.error('Could not load your profile', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!profile) return;
		saving = true;
		try {
			profile = await updateMyProfile({
				personalEmail: profile.personalEmail ?? undefined,
				phone: profile.phone ?? undefined,
				alternatePhone: profile.alternatePhone ?? undefined,
				dateOfBirth: dobInput || undefined,
				gender: profile.gender ?? undefined,
				maritalStatus: profile.maritalStatus ?? undefined,
				bloodGroup: profile.bloodGroup ?? undefined,
				nationality: profile.nationality ?? undefined,
				photoUrl: profile.photoUrl ?? undefined,
				addressLine1: profile.addressLine1 ?? undefined,
				addressLine2: profile.addressLine2 ?? undefined,
				city: profile.city ?? undefined,
				state: profile.state ?? undefined,
				country: profile.country ?? undefined,
				postalCode: profile.postalCode ?? undefined
			});
			dobInput = profile.dateOfBirth?.slice(0, 10) ?? '';
			toasts.success('Profile updated');
		} catch (err) {
			toasts.error('Could not update your profile', extractErrorMessage(err));
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>My Profile — Atyantik EMS</title>
</svelte:head>

<div class="mb-3">
	<h1 class="h4 fw-bold mb-1">My Profile</h1>
	<p class="text-muted-2 mb-0">View your job details and keep your contact information up to date.</p>
</div>

{#if loading || !profile}
	<div class="skeleton" style="height: 320px;"></div>
{:else}
	<div class="card border-0 shadow-sm mb-3">
		<div class="card-body">
			<h2 class="h6 fw-bold mb-3">Job details</h2>
			<div class="row g-3">
				<div class="col-md-3">
					<div class="small text-muted-2">Employee code</div>
					<div class="fw-semibold">{profile.employeeCode}</div>
				</div>
				<div class="col-md-3">
					<div class="small text-muted-2">Name</div>
					<div class="fw-semibold">{profile.firstName} {profile.lastName}</div>
				</div>
				<div class="col-md-3">
					<div class="small text-muted-2">Department</div>
					<div class="fw-semibold">{profile.department?.name ?? '—'}</div>
				</div>
				<div class="col-md-3">
					<div class="small text-muted-2">Designation</div>
					<div class="fw-semibold">{profile.designation?.title ?? '—'}</div>
				</div>
				<div class="col-md-3">
					<div class="small text-muted-2">Date of joining</div>
					<div class="fw-semibold">{profile.dateOfJoining?.slice(0, 10)}</div>
				</div>
				<div class="col-md-3">
					<div class="small text-muted-2">Status</div>
					<div class="fw-semibold">{profile.status}</div>
				</div>
				<div class="col-md-3">
					<div class="small text-muted-2">Work email</div>
					<div class="fw-semibold">{profile.user.email}</div>
				</div>
			</div>
			<p class="text-muted-2 small mb-0 mt-3">
				Job details are managed by your administrator. Contact HR if any of the above needs to
				change.
			</p>
		</div>
	</div>

	<div class="card border-0 shadow-sm">
		<div class="card-body">
			<h2 class="h6 fw-bold mb-3">Contact &amp; personal information</h2>
			<form onsubmit={handleSubmit}>
				<div class="row g-3">
					<div class="col-md-6">
						<label for="personalEmail" class="form-label small fw-semibold">Personal email</label>
						<input
							id="personalEmail"
							type="email"
							class="form-control"
							bind:value={profile.personalEmail}
						/>
					</div>
					<div class="col-md-3">
						<label for="phone" class="form-label small fw-semibold">Phone</label>
						<input id="phone" type="text" class="form-control" bind:value={profile.phone} />
					</div>
					<div class="col-md-3">
						<label for="alternatePhone" class="form-label small fw-semibold"
							>Alternate phone</label
						>
						<input
							id="alternatePhone"
							type="text"
							class="form-control"
							bind:value={profile.alternatePhone}
						/>
					</div>
					<div class="col-md-3">
						<label for="dateOfBirth" class="form-label small fw-semibold">Date of birth</label>
						<input id="dateOfBirth" type="date" class="form-control" bind:value={dobInput} />
					</div>
					<div class="col-md-3">
						<label for="gender" class="form-label small fw-semibold">Gender</label>
						<select id="gender" class="form-select" bind:value={profile.gender}>
							<option value={null}>—</option>
							<option value="MALE">Male</option>
							<option value="FEMALE">Female</option>
							<option value="OTHER">Other</option>
							<option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
						</select>
					</div>
					<div class="col-md-3">
						<label for="maritalStatus" class="form-label small fw-semibold">Marital status</label
						>
						<select id="maritalStatus" class="form-select" bind:value={profile.maritalStatus}>
							<option value={null}>—</option>
							<option value="SINGLE">Single</option>
							<option value="MARRIED">Married</option>
							<option value="DIVORCED">Divorced</option>
							<option value="WIDOWED">Widowed</option>
						</select>
					</div>
					<div class="col-md-3">
						<label for="bloodGroup" class="form-label small fw-semibold">Blood group</label>
						<select id="bloodGroup" class="form-select" bind:value={profile.bloodGroup}>
							<option value={null}>—</option>
							<option value="A_POSITIVE">A+</option>
							<option value="A_NEGATIVE">A-</option>
							<option value="B_POSITIVE">B+</option>
							<option value="B_NEGATIVE">B-</option>
							<option value="AB_POSITIVE">AB+</option>
							<option value="AB_NEGATIVE">AB-</option>
							<option value="O_POSITIVE">O+</option>
							<option value="O_NEGATIVE">O-</option>
						</select>
					</div>
					<div class="col-md-3">
						<label for="nationality" class="form-label small fw-semibold">Nationality</label>
						<input
							id="nationality"
							type="text"
							class="form-control"
							bind:value={profile.nationality}
						/>
					</div>
					<div class="col-12">
						<label for="addressLine1" class="form-label small fw-semibold">Address line 1</label>
						<input
							id="addressLine1"
							type="text"
							class="form-control"
							bind:value={profile.addressLine1}
						/>
					</div>
					<div class="col-12">
						<label for="addressLine2" class="form-label small fw-semibold">Address line 2</label>
						<input
							id="addressLine2"
							type="text"
							class="form-control"
							bind:value={profile.addressLine2}
						/>
					</div>
					<div class="col-md-3">
						<label for="city" class="form-label small fw-semibold">City</label>
						<input id="city" type="text" class="form-control" bind:value={profile.city} />
					</div>
					<div class="col-md-3">
						<label for="state" class="form-label small fw-semibold">State</label>
						<input id="state" type="text" class="form-control" bind:value={profile.state} />
					</div>
					<div class="col-md-3">
						<label for="country" class="form-label small fw-semibold">Country</label>
						<input id="country" type="text" class="form-control" bind:value={profile.country} />
					</div>
					<div class="col-md-3">
						<label for="postalCode" class="form-label small fw-semibold">Postal code</label>
						<input
							id="postalCode"
							type="text"
							class="form-control"
							bind:value={profile.postalCode}
						/>
					</div>
				</div>
				<div class="mt-3">
					<button type="submit" class="btn btn-primary" disabled={saving}>
						{#if saving}
							<span
								class="spinner-border spinner-border-sm me-2"
								role="status"
								aria-hidden="true"
							></span>
						{/if}
						Save changes
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
