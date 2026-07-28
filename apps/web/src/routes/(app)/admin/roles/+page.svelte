<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import DataTable, { type Column } from '../../../../lib/components/ui/DataTable.svelte';
	import Modal from '../../../../lib/components/ui/Modal.svelte';
	import {
		createRole,
		deleteRole,
		getRole,
		listPermissions,
		listRoles,
		setRolePermissions,
		updateRole
	} from '../../../../lib/features/admin/api.js';
	import type { CreateRoleInput, Permission, Role } from '../../../../lib/features/admin/types.js';
	import { listEmployees, setEmployeeRole } from '../../../../lib/features/employee/api.js';
	import type { EmployeeListItem } from '../../../../lib/features/employee/types.js';
	import { extractErrorMessage } from '../../../../lib/services/api-client.js';
	import { toasts } from '../../../../lib/stores/toast.js';

	let activeTab = $state<'roles' | 'employees'>('roles');

	let roles = $state<Role[]>([]);
	let permissions = $state<Permission[]>([]);
	let loading = $state(true);

	let editModalOpen = $state(false);
	let editingRole = $state<Role | null>(null);
	let selectedPermissionIds = new SvelteSet<string>();
	let saving = $state(false);

	let roleModalOpen = $state(false);
	let roleModalMode = $state<'create' | 'rename'>('create');
	let renamingRole = $state<Role | null>(null);
	let roleForm = $state<CreateRoleInput>({ name: '', slug: '', description: '' });
	let savingRole = $state(false);

	// Employees tab — lists every employee alongside their currently assigned role.
	let employees = $state<EmployeeListItem[]>([]);
	let employeesTotal = $state(0);
	let employeesPage = $state(1);
	let employeesLoading = $state(false);
	let employeeSearch = $state('');

	let employeeRoleModalOpen = $state(false);
	let employeeForRole = $state<EmployeeListItem | null>(null);
	let selectedEmployeeRoleId = $state('');
	let savingEmployeeRole = $state(false);

	const permissionsByModule = $derived.by(() => {
		const groups = new SvelteMap<string, Permission[]>();
		for (const permission of permissions) {
			const list = groups.get(permission.module) ?? [];
			list.push(permission);
			groups.set(permission.module, list);
		}
		return groups;
	});

	const employeeColumns: Column[] = [
		{ key: 'employeeCode', label: 'Code', width: '110px' },
		{ key: 'firstName', label: 'Name', sortable: true },
		{ key: 'department.name', label: 'Department' },
		{ key: 'role', label: 'Role' }
	];

	function roleNameFor(employee: EmployeeListItem): string {
		return employee.user.userRoles?.map((ur) => ur.role.name).join(', ') || '—';
	}

	async function load() {
		loading = true;
		try {
			const [roleList, permissionList] = await Promise.all([listRoles(), listPermissions()]);
			roles = roleList;
			permissions = permissionList;
		} catch (err) {
			toasts.error('Could not load roles', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	async function loadEmployees() {
		employeesLoading = true;
		try {
			const result = await listEmployees({
				page: employeesPage,
				pageSize: 20,
				search: employeeSearch || undefined
			});
			employees = result.items;
			employeesTotal = result.total;
		} catch (err) {
			toasts.error('Could not load employees', extractErrorMessage(err));
		} finally {
			employeesLoading = false;
		}
	}

	onMount(async () => {
		await load();
		await loadEmployees();
	});

	async function openEdit(role: Role) {
		if (role.isSystem) {
			toasts.info('System roles cannot be edited', `"${role.name}" has a fixed permission set.`);
			return;
		}
		try {
			const full = await getRole(role.id);
			editingRole = full;
			selectedPermissionIds.clear();
			for (const rp of full.rolePermissions ?? []) {
				selectedPermissionIds.add(rp.permission.id);
			}
			editModalOpen = true;
		} catch (err) {
			toasts.error('Could not load role details', extractErrorMessage(err));
		}
	}

	function togglePermission(id: string) {
		if (selectedPermissionIds.has(id)) {
			selectedPermissionIds.delete(id);
		} else {
			selectedPermissionIds.add(id);
		}
	}

	async function handleSave() {
		if (!editingRole) return;
		saving = true;
		try {
			await setRolePermissions(editingRole.id, Array.from(selectedPermissionIds));
			toasts.success('Permissions updated');
			editModalOpen = false;
			await load();
		} catch (err) {
			toasts.error('Could not update permissions', extractErrorMessage(err));
		} finally {
			saving = false;
		}
	}

	function openCreateRoleModal() {
		roleModalMode = 'create';
		renamingRole = null;
		roleForm = { name: '', slug: '', description: '' };
		roleModalOpen = true;
	}

	function openRenameRoleModal(role: Role) {
		if (role.isSystem) {
			toasts.info('System roles cannot be renamed', `"${role.name}" is a fixed system role.`);
			return;
		}
		roleModalMode = 'rename';
		renamingRole = role;
		roleForm = { name: role.name, slug: role.slug, description: role.description ?? '' };
		roleModalOpen = true;
	}

	async function handleRoleFormSubmit(event: SubmitEvent) {
		event.preventDefault();
		savingRole = true;
		try {
			if (roleModalMode === 'create') {
				await createRole(roleForm);
				toasts.success('Role created');
			} else if (renamingRole) {
				await updateRole(renamingRole.id, {
					name: roleForm.name,
					description: roleForm.description
				});
				toasts.success('Role updated');
			}
			roleModalOpen = false;
			await load();
		} catch (err) {
			toasts.error(
				roleModalMode === 'create' ? 'Could not create role' : 'Could not update role',
				extractErrorMessage(err)
			);
		} finally {
			savingRole = false;
		}
	}

	async function handleDeleteRole(role: Role) {
		if (role.isSystem) {
			toasts.info('System roles cannot be deleted', `"${role.name}" is a fixed system role.`);
			return;
		}
		if (!confirm(`Delete the "${role.name}" role? This cannot be undone.`)) return;
		try {
			await deleteRole(role.id);
			toasts.success('Role deleted');
			await load();
		} catch (err) {
			toasts.error('Could not delete role', extractErrorMessage(err));
		}
	}

	function openEmployeeRoleModal(employee: EmployeeListItem) {
		employeeForRole = employee;
		selectedEmployeeRoleId = employee.user.userRoles?.[0]?.role.id ?? '';
		employeeRoleModalOpen = true;
	}

	async function handleEmployeeRoleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!employeeForRole || !selectedEmployeeRoleId) return;
		savingEmployeeRole = true;
		try {
			await setEmployeeRole(employeeForRole.id, selectedEmployeeRoleId);
			toasts.success("Employee's role updated — they will need to log in again for it to take effect");
			employeeRoleModalOpen = false;
			await loadEmployees();
		} catch (err) {
			toasts.error("Could not update employee's role", extractErrorMessage(err));
		} finally {
			savingEmployeeRole = false;
		}
	}

	function handleEmployeeSearchChange(value: string) {
		employeeSearch = value;
		employeesPage = 1;
		void loadEmployees();
	}

	function handleEmployeePageChange(page: number) {
		employeesPage = page;
		void loadEmployees();
	}
</script>

<svelte:head>
	<title>Roles & Permissions — Atyantik EMS</title>
</svelte:head>

<div class="mb-3">
	<h1 class="h4 fw-bold mb-1">Roles &amp; Permissions</h1>
	<p class="text-muted-2 mb-0">
		Only the Super Admin can create roles, edit their permissions, and assign roles to employees.
	</p>
</div>

<ul class="nav nav-tabs mb-3">
	<li class="nav-item">
		<button
			type="button"
			class="nav-link"
			class:active={activeTab === 'roles'}
			onclick={() => (activeTab = 'roles')}
		>
			Roles
		</button>
	</li>
	<li class="nav-item">
		<button
			type="button"
			class="nav-link"
			class:active={activeTab === 'employees'}
			onclick={() => (activeTab = 'employees')}
		>
			Employees
		</button>
	</li>
</ul>

{#if activeTab === 'roles'}
	<div class="d-flex justify-content-end mb-3">
		<button type="button" class="btn btn-primary btn-sm" onclick={openCreateRoleModal}>
			<i class="bi bi-plus-lg me-1"></i>New Role
		</button>
	</div>

	{#if loading}
		<div class="skeleton" style="height: 200px;"></div>
	{:else}
		<div class="row g-3">
			{#each roles as role (role.id)}
				<div class="col-md-6 col-lg-4">
					<div class="card border-0 shadow-sm h-100">
						<div class="card-body">
							<div class="d-flex justify-content-between align-items-start">
								<div>
									<h2 class="h6 fw-bold mb-1">{role.name}</h2>
									<p class="text-muted-2 small mb-2">{role.description ?? '—'}</p>
								</div>
								{#if role.isSystem}
									<span class="badge text-bg-secondary">System</span>
								{/if}
							</div>
							<div class="d-flex gap-1 flex-wrap">
								<button
									type="button"
									class="btn btn-sm btn-outline-secondary"
									onclick={() => openEdit(role)}
								>
									{role.isSystem ? 'View' : 'Edit permissions'}
								</button>
								{#if !role.isSystem}
									<button
										type="button"
										class="btn btn-sm btn-outline-secondary"
										onclick={() => openRenameRoleModal(role)}
									>
										Rename
									</button>
									<button
										type="button"
										class="btn btn-sm btn-outline-danger"
										onclick={() => handleDeleteRole(role)}
									>
										Delete
									</button>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
{:else}
	<div class="card border-0 shadow-sm">
		<div class="card-body">
			<DataTable
				columns={employeeColumns}
				rows={employees}
				rowKey={(row) => row.id}
				loading={employeesLoading}
				total={employeesTotal}
				page={employeesPage}
				pageSize={20}
				searchPlaceholder="Search by name, code, or email…"
				emptyTitle="No employees found"
				onPageChange={handleEmployeePageChange}
				onSearchChange={handleEmployeeSearchChange}
			>
				{#snippet rowActions(row)}
					<button
						type="button"
						class="btn btn-sm btn-outline-secondary"
						onclick={() => openEmployeeRoleModal(row)}
					>
						Change role
					</button>
				{/snippet}
			</DataTable>
		</div>
	</div>
{/if}

<Modal
	open={editModalOpen}
	title={`Permissions — ${editingRole?.name ?? ''}`}
	size="lg"
	onClose={() => (editModalOpen = false)}
>
	<div class="permission-matrix">
		{#each [...permissionsByModule.entries()] as [module, modulePermissions] (module)}
			<div class="mb-3">
				<div class="fw-semibold small text-capitalize mb-1">{module.replaceAll('_', ' ')}</div>
				<div class="d-flex flex-wrap gap-3">
					{#each modulePermissions as permission (permission.id)}
						<div class="form-check">
							<input
								id={`perm-${permission.id}`}
								type="checkbox"
								class="form-check-input"
								checked={selectedPermissionIds.has(permission.id)}
								onchange={() => togglePermission(permission.id)}
							/>
							<label for={`perm-${permission.id}`} class="form-check-label small text-capitalize">
								{permission.action}
							</label>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	{#snippet footer()}
		<button type="button" class="btn btn-outline-secondary" onclick={() => (editModalOpen = false)}
			>Cancel</button
		>
		<button type="button" class="btn btn-primary" disabled={saving} onclick={handleSave}>
			{#if saving}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Save permissions
		</button>
	{/snippet}
</Modal>

<Modal
	open={roleModalOpen}
	title={roleModalMode === 'create' ? 'New Role' : `Rename — ${renamingRole?.name ?? ''}`}
	onClose={() => (roleModalOpen = false)}
>
	<form id="role-form" onsubmit={handleRoleFormSubmit}>
		<div class="mb-3">
			<label for="roleName" class="form-label small fw-semibold">Name</label>
			<input id="roleName" type="text" class="form-control" bind:value={roleForm.name} required />
		</div>
		{#if roleModalMode === 'create'}
			<div class="mb-3">
				<label for="roleSlug" class="form-label small fw-semibold">Slug</label>
				<input
					id="roleSlug"
					type="text"
					class="form-control"
					bind:value={roleForm.slug}
					pattern="[a-z0-9-]+"
					placeholder="e.g. hr-manager"
					required
				/>
				<div class="form-text">Lowercase letters, numbers, and hyphens only.</div>
			</div>
		{/if}
		<div class="mb-0">
			<label for="roleDescription" class="form-label small fw-semibold">Description</label>
			<textarea
				id="roleDescription"
				class="form-control"
				rows="2"
				bind:value={roleForm.description}
			></textarea>
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
			{roleModalMode === 'create' ? 'Create role' : 'Save changes'}
		</button>
	{/snippet}
</Modal>

<Modal
	open={employeeRoleModalOpen}
	title={`Change Role — ${employeeForRole ? `${employeeForRole.firstName} ${employeeForRole.lastName}` : ''}`}
	onClose={() => (employeeRoleModalOpen = false)}
>
	<form id="employee-role-form" onsubmit={handleEmployeeRoleSubmit}>
		<div class="mb-0">
			<label for="employeeRole" class="form-label small fw-semibold">Role</label>
			<select
				id="employeeRole"
				class="form-select"
				bind:value={selectedEmployeeRoleId}
				required
			>
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
		<button
			type="button"
			class="btn btn-outline-secondary"
			onclick={() => (employeeRoleModalOpen = false)}>Cancel</button
		>
		<button
			type="submit"
			form="employee-role-form"
			class="btn btn-primary"
			disabled={savingEmployeeRole}
		>
			{#if savingEmployeeRole}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Save role
		</button>
	{/snippet}
</Modal>

<style lang="scss">
	.permission-matrix {
		max-height: 60vh;
		overflow-y: auto;
	}
</style>
