<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import EmptyState from '../../../../lib/components/ui/EmptyState.svelte';
	import Modal from '../../../../lib/components/ui/Modal.svelte';
	import StatusBadge from '../../../../lib/components/ui/StatusBadge.svelte';
	import { getEmployee, setEmployeeRole, updateEmployee } from '../../../../lib/features/employee/api.js';
	import type { UpdateEmployeeInput } from '../../../../lib/features/employee/types.js';
	import { listRoles } from '../../../../lib/features/admin/api.js';
	import type { Role } from '../../../../lib/features/admin/types.js';
	import { listAllBranches, listAllDepartments, listAllDesignations } from '../../../../lib/features/org/api.js';
	import type { Branch, Department, Designation } from '../../../../lib/features/org/types.js';
	import { extractErrorMessage } from '../../../../lib/services/api-client.js';
	import { hasPermission, isSuperAdmin } from '../../../../lib/stores/auth.js';
	import { toasts } from '../../../../lib/stores/toast.js';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let employee = $state<any>(null);
	let loading = $state(true);

	let departments = $state<Department[]>([]);
	let designations = $state<Designation[]>([]);
	let branches = $state<Branch[]>([]);
	let roles = $state<Role[]>([]);

	let editModalOpen = $state(false);
	let saving = $state(false);
	let editForm = $state<UpdateEmployeeInput>({});

	let roleModalOpen = $state(false);
	let savingRole = $state(false);
	let selectedRoleId = $state('');

	const canEdit = hasPermission('employee:update');
	const canOverrideStatus = isSuperAdmin();
	const canManageRole = hasPermission('role:update');

	async function load() {
		loading = true;
		try {
			employee = await getEmployee(page.params.id as string);
		} catch (err) {
			toasts.error('Could not load employee', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		await load();
		Promise.all([listAllDepartments(), listAllDesignations(), listAllBranches()])
			.then(([d, des, b]) => {
				departments = d;
				designations = des;
				branches = b;
			})
			.catch(() => undefined);
		if (canManageRole) {
			listRoles()
				.then((r) => (roles = r))
				.catch(() => undefined);
		}
	});

	function openRoleModal() {
		selectedRoleId = employee.user?.userRoles?.[0]?.role?.id ?? '';
		roleModalOpen = true;
	}

	async function handleRoleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!selectedRoleId) return;
		savingRole = true;
		try {
			await setEmployeeRole(employee.id, selectedRoleId);
			toasts.success('Role updated — the employee will need to log in again for it to take effect');
			roleModalOpen = false;
			await load();
		} catch (err) {
			toasts.error('Could not update role', extractErrorMessage(err));
		} finally {
			savingRole = false;
		}
	}

	function openEditModal() {
		editForm = {
			firstName: employee.firstName,
			lastName: employee.lastName,
			personalEmail: employee.personalEmail ?? undefined,
			phone: employee.phone ?? undefined,
			departmentId: employee.department?.id,
			designationId: employee.designation?.id,
			branchId: employee.branch?.id,
			dateOfJoining: employee.dateOfJoining?.slice(0, 10),
			employmentType: employee.employmentType,
			status: employee.status,
			dateOfBirth: employee.dateOfBirth?.slice(0, 10) ?? undefined,
			gender: employee.gender ?? undefined,
			maritalStatus: employee.maritalStatus ?? undefined,
			bloodGroup: employee.bloodGroup ?? undefined,
			nationality: employee.nationality ?? undefined,
			addressLine1: employee.addressLine1 ?? undefined,
			addressLine2: employee.addressLine2 ?? undefined,
			city: employee.city ?? undefined,
			state: employee.state ?? undefined,
			country: employee.country ?? undefined,
			postalCode: employee.postalCode ?? undefined
		};
		editModalOpen = true;
	}

	async function handleEditSubmit(event: SubmitEvent) {
		event.preventDefault();
		saving = true;
		try {
			await updateEmployee(employee.id, editForm);
			toasts.success('Employee updated');
			editModalOpen = false;
			await load();
		} catch (err) {
			toasts.error('Could not update employee', extractErrorMessage(err));
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title
		>{employee ? `${employee.firstName} ${employee.lastName}` : 'Employee'} — Atyantik EMS</title
	>
</svelte:head>

<a href="/employees" class="d-inline-flex align-items-center gap-1 mb-3 small">
	<i class="bi bi-arrow-left"></i> Back to employees
</a>

{#if loading}
	<div class="skeleton" style="height: 220px;"></div>
{:else if !employee}
	<EmptyState icon="bi-person-x" title="Employee not found" />
{:else}
	<div class="card border-0 shadow-sm mb-3">
		<div class="card-body d-flex flex-wrap gap-3 align-items-center">
			<div class="employee-avatar">
				{employee.firstName?.[0]}{employee.lastName?.[0]}
			</div>
			<div class="flex-grow-1">
				<h1 class="h4 fw-bold mb-1">{employee.firstName} {employee.lastName}</h1>
				<p class="text-muted-2 mb-1">
					{employee.designation?.title ?? '—'} · {employee.department?.name ?? '—'}
				</p>
				<div class="d-flex gap-2 align-items-center flex-wrap">
					<StatusBadge status={employee.status} />
					<span class="text-muted-2 small">{employee.employeeCode}</span>
					{#if employee.user?.userRoles?.length}
						<span class="badge text-bg-light border"
							>{employee.user.userRoles
								.map((ur: { role: { name: string } }) => ur.role.name)
								.join(', ')}</span
						>
					{/if}
				</div>
			</div>
			<div class="d-flex gap-2">
				{#if canManageRole}
					<button type="button" class="btn btn-outline-secondary btn-sm" onclick={openRoleModal}>
						<i class="bi bi-shield-lock me-1"></i>Role
					</button>
				{/if}
				{#if canEdit}
					<button type="button" class="btn btn-outline-secondary btn-sm" onclick={openEditModal}>
						<i class="bi bi-pencil me-1"></i>Edit
					</button>
				{/if}
			</div>
		</div>
	</div>

	<div class="row g-3">
		<div class="col-lg-6">
			<div class="card border-0 shadow-sm h-100">
				<div class="card-body">
					<h2 class="h6 fw-bold mb-3">Personal details</h2>
					<dl class="row mb-0 small">
						<dt class="col-5 text-muted-2 fw-normal">Personal email</dt>
						<dd class="col-7">{employee.personalEmail ?? '—'}</dd>
						<dt class="col-5 text-muted-2 fw-normal">Phone</dt>
						<dd class="col-7">{employee.phone ?? '—'}</dd>
						<dt class="col-5 text-muted-2 fw-normal">Date of birth</dt>
						<dd class="col-7">
							{employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : '—'}
						</dd>
						<dt class="col-5 text-muted-2 fw-normal">Gender</dt>
						<dd class="col-7">{employee.gender ?? '—'}</dd>
						<dt class="col-5 text-muted-2 fw-normal">Nationality</dt>
						<dd class="col-7">{employee.nationality ?? '—'}</dd>
					</dl>
				</div>
			</div>
		</div>

		<div class="col-lg-6">
			<div class="card border-0 shadow-sm h-100">
				<div class="card-body">
					<h2 class="h6 fw-bold mb-3">Professional details</h2>
					<dl class="row mb-0 small">
						<dt class="col-5 text-muted-2 fw-normal">Employment type</dt>
						<dd class="col-7">{employee.employmentType}</dd>
						<dt class="col-5 text-muted-2 fw-normal">Date of joining</dt>
						<dd class="col-7">{new Date(employee.dateOfJoining).toLocaleDateString()}</dd>
						<dt class="col-5 text-muted-2 fw-normal">Branch</dt>
						<dd class="col-7">{employee.branch?.name ?? '—'}</dd>
						<dt class="col-5 text-muted-2 fw-normal">Team</dt>
						<dd class="col-7">{employee.team?.name ?? '—'}</dd>
						<dt class="col-5 text-muted-2 fw-normal">Reporting manager</dt>
						<dd class="col-7">
							{employee.reportingManager
								? `${employee.reportingManager.firstName} ${employee.reportingManager.lastName}`
								: '—'}
						</dd>
					</dl>
				</div>
			</div>
		</div>

		{#if employee.emergencyContacts?.length}
			<div class="col-lg-6">
				<div class="card border-0 shadow-sm h-100">
					<div class="card-body">
						<h2 class="h6 fw-bold mb-3">Emergency contacts</h2>
						<ul class="list-unstyled mb-0 small d-flex flex-column gap-2">
							{#each employee.emergencyContacts as contact (contact.id)}
								<li>
									<div class="fw-semibold">
										{contact.name} <span class="text-muted-2">({contact.relationship})</span>
									</div>
									<div class="text-muted-2">{contact.phone}</div>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>
		{/if}

		{#if employee.employeeSkills?.length}
			<div class="col-lg-6">
				<div class="card border-0 shadow-sm h-100">
					<div class="card-body">
						<h2 class="h6 fw-bold mb-3">Skills</h2>
						<div class="d-flex flex-wrap gap-2">
							{#each employee.employeeSkills as es (es.id)}
								<span class="badge text-bg-light border"
									>{es.skill.name} · {es.proficiency.toLowerCase()}</span
								>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}

<Modal open={editModalOpen} title="Edit Employee" size="lg" onClose={() => (editModalOpen = false)}>
	<form id="edit-employee-form" onsubmit={handleEditSubmit}>
		<div class="row g-3 mb-3">
			<div class="col-6">
				<label for="editFirstName" class="form-label small fw-semibold">First name</label>
				<input
					id="editFirstName"
					type="text"
					class="form-control"
					bind:value={editForm.firstName}
					required
				/>
			</div>
			<div class="col-6">
				<label for="editLastName" class="form-label small fw-semibold">Last name</label>
				<input
					id="editLastName"
					type="text"
					class="form-control"
					bind:value={editForm.lastName}
					required
				/>
			</div>
			<div class="col-6">
				<label for="editPersonalEmail" class="form-label small fw-semibold">Personal email</label>
				<input
					id="editPersonalEmail"
					type="email"
					class="form-control"
					bind:value={editForm.personalEmail}
				/>
			</div>
			<div class="col-6">
				<label for="editPhone" class="form-label small fw-semibold">Phone</label>
				<input id="editPhone" type="text" class="form-control" bind:value={editForm.phone} />
			</div>
			<div class="col-6">
				<label for="editDepartment" class="form-label small fw-semibold">Department</label>
				<select id="editDepartment" class="form-select" bind:value={editForm.departmentId}>
					<option value={undefined}>—</option>
					{#each departments as dept (dept.id)}
						<option value={dept.id}>{dept.name}</option>
					{/each}
				</select>
			</div>
			<div class="col-6">
				<label for="editDesignation" class="form-label small fw-semibold">Designation</label>
				<select id="editDesignation" class="form-select" bind:value={editForm.designationId}>
					<option value={undefined}>—</option>
					{#each designations as designation (designation.id)}
						<option value={designation.id}>{designation.title}</option>
					{/each}
				</select>
			</div>
			<div class="col-6">
				<label for="editBranch" class="form-label small fw-semibold">Branch</label>
				<select id="editBranch" class="form-select" bind:value={editForm.branchId}>
					<option value={undefined}>—</option>
					{#each branches as branch (branch.id)}
						<option value={branch.id}>{branch.name}</option>
					{/each}
				</select>
			</div>
			<div class="col-6">
				<label for="editDateOfJoining" class="form-label small fw-semibold">Date of joining</label>
				<input
					id="editDateOfJoining"
					type="date"
					class="form-control"
					bind:value={editForm.dateOfJoining}
				/>
			</div>
			<div class="col-6">
				<label for="editEmploymentType" class="form-label small fw-semibold">Employment type</label>
				<select id="editEmploymentType" class="form-select" bind:value={editForm.employmentType}>
					<option value="FULL_TIME">Full time</option>
					<option value="PART_TIME">Part time</option>
					<option value="CONTRACT">Contract</option>
					<option value="INTERN">Intern</option>
					<option value="CONSULTANT">Consultant</option>
				</select>
			</div>
			{#if canOverrideStatus}
				<div class="col-6">
					<label for="editStatus" class="form-label small fw-semibold">Status</label>
					<select id="editStatus" class="form-select" bind:value={editForm.status}>
						<option value="PROBATION">Probation</option>
						<option value="ACTIVE">Permanent / Active</option>
						<option value="ON_LEAVE">On leave</option>
						<option value="SUSPENDED">Suspended</option>
						<option value="NOTICE_PERIOD">Notice period</option>
						<option value="RESIGNED">Resigned</option>
						<option value="TERMINATED">Terminated</option>
						<option value="ABSCONDED">Absconded</option>
					</select>
				</div>
			{/if}
		</div>

		<h3 class="h6 fw-bold mb-3">Personal &amp; contact information</h3>
		<div class="row g-3">
			<div class="col-6">
				<label for="editDob" class="form-label small fw-semibold">Date of birth</label>
				<input id="editDob" type="date" class="form-control" bind:value={editForm.dateOfBirth} />
			</div>
			<div class="col-6">
				<label for="editGender" class="form-label small fw-semibold">Gender</label>
				<select id="editGender" class="form-select" bind:value={editForm.gender}>
					<option value={undefined}>—</option>
					<option value="MALE">Male</option>
					<option value="FEMALE">Female</option>
					<option value="OTHER">Other</option>
					<option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
				</select>
			</div>
			<div class="col-6">
				<label for="editMaritalStatus" class="form-label small fw-semibold">Marital status</label>
				<select id="editMaritalStatus" class="form-select" bind:value={editForm.maritalStatus}>
					<option value={undefined}>—</option>
					<option value="SINGLE">Single</option>
					<option value="MARRIED">Married</option>
					<option value="DIVORCED">Divorced</option>
					<option value="WIDOWED">Widowed</option>
				</select>
			</div>
			<div class="col-6">
				<label for="editBloodGroup" class="form-label small fw-semibold">Blood group</label>
				<select id="editBloodGroup" class="form-select" bind:value={editForm.bloodGroup}>
					<option value={undefined}>—</option>
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
			<div class="col-6">
				<label for="editNationality" class="form-label small fw-semibold">Nationality</label>
				<input id="editNationality" type="text" class="form-control" bind:value={editForm.nationality} />
			</div>
			<div class="col-12">
				<label for="editAddressLine1" class="form-label small fw-semibold">Address line 1</label>
				<input
					id="editAddressLine1"
					type="text"
					class="form-control"
					bind:value={editForm.addressLine1}
				/>
			</div>
			<div class="col-12">
				<label for="editAddressLine2" class="form-label small fw-semibold">Address line 2</label>
				<input
					id="editAddressLine2"
					type="text"
					class="form-control"
					bind:value={editForm.addressLine2}
				/>
			</div>
			<div class="col-3">
				<label for="editCity" class="form-label small fw-semibold">City</label>
				<input id="editCity" type="text" class="form-control" bind:value={editForm.city} />
			</div>
			<div class="col-3">
				<label for="editState" class="form-label small fw-semibold">State</label>
				<input id="editState" type="text" class="form-control" bind:value={editForm.state} />
			</div>
			<div class="col-3">
				<label for="editCountry" class="form-label small fw-semibold">Country</label>
				<input id="editCountry" type="text" class="form-control" bind:value={editForm.country} />
			</div>
			<div class="col-3">
				<label for="editPostalCode" class="form-label small fw-semibold">Postal code</label>
				<input
					id="editPostalCode"
					type="text"
					class="form-control"
					bind:value={editForm.postalCode}
				/>
			</div>
		</div>
	</form>

	{#snippet footer()}
		<button type="button" class="btn btn-outline-secondary" onclick={() => (editModalOpen = false)}
			>Cancel</button
		>
		<button type="submit" form="edit-employee-form" class="btn btn-primary" disabled={saving}>
			{#if saving}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Save changes
		</button>
	{/snippet}
</Modal>

<Modal open={roleModalOpen} title="Change Role" onClose={() => (roleModalOpen = false)}>
	<form id="role-form" onsubmit={handleRoleSubmit}>
		<div class="mb-0">
			<label for="employeeRole" class="form-label small fw-semibold">Role</label>
			<select id="employeeRole" class="form-select" bind:value={selectedRoleId} required>
				<option value="" disabled>Select a role</option>
				{#each roles as role (role.id)}
					<option value={role.id}>{role.name}</option>
				{/each}
			</select>
			<div class="form-text">
				Changing the role revokes the employee's current session — they'll need to log in again.
			</div>
		</div>
	</form>

	{#snippet footer()}
		<button type="button" class="btn btn-outline-secondary" onclick={() => (roleModalOpen = false)}
			>Cancel</button
		>
		<button type="submit" form="role-form" class="btn btn-primary" disabled={savingRole}>
			{#if savingRole}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Save role
		</button>
	{/snippet}
</Modal>

<style lang="scss">
	.employee-avatar {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: linear-gradient(135deg, #2452b8, #4d7ff0);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.25rem;
		flex-shrink: 0;
	}
</style>
