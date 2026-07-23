<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import EmptyState from '../../../../lib/components/ui/EmptyState.svelte';
	import StatusBadge from '../../../../lib/components/ui/StatusBadge.svelte';
	import { getEmployee } from '../../../../lib/features/employee/api.js';
	import { extractErrorMessage } from '../../../../lib/services/api-client.js';
	import { toasts } from '../../../../lib/stores/toast.js';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let employee = $state<any>(null);
	let loading = $state(true);

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

	onMount(load);
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
				<div class="d-flex gap-2 align-items-center">
					<StatusBadge status={employee.status} />
					<span class="text-muted-2 small">{employee.employeeCode}</span>
				</div>
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
