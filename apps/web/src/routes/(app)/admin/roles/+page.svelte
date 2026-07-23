<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import Modal from '../../../../lib/components/ui/Modal.svelte';
	import {
		getRole,
		listPermissions,
		listRoles,
		setRolePermissions
	} from '../../../../lib/features/admin/api.js';
	import type { Permission, Role } from '../../../../lib/features/admin/types.js';
	import { extractErrorMessage } from '../../../../lib/services/api-client.js';
	import { toasts } from '../../../../lib/stores/toast.js';

	let roles = $state<Role[]>([]);
	let permissions = $state<Permission[]>([]);
	let loading = $state(true);

	let editModalOpen = $state(false);
	let editingRole = $state<Role | null>(null);
	let selectedPermissionIds = new SvelteSet<string>();
	let saving = $state(false);

	const permissionsByModule = $derived.by(() => {
		const groups = new SvelteMap<string, Permission[]>();
		for (const permission of permissions) {
			const list = groups.get(permission.module) ?? [];
			list.push(permission);
			groups.set(permission.module, list);
		}
		return groups;
	});

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

	onMount(load);

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
</script>

<svelte:head>
	<title>Roles & Permissions — Atyantik EMS</title>
</svelte:head>

<div class="mb-3">
	<h1 class="h4 fw-bold mb-1">Roles &amp; Permissions</h1>
	<p class="text-muted-2 mb-0">
		Only the Super Admin role has full access; other roles are scoped explicitly.
	</p>
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
						<button
							type="button"
							class="btn btn-sm btn-outline-secondary"
							onclick={() => openEdit(role)}
						>
							{role.isSystem ? 'View' : 'Edit permissions'}
						</button>
					</div>
				</div>
			</div>
		{/each}
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

<style lang="scss">
	.permission-matrix {
		max-height: 60vh;
		overflow-y: auto;
	}
</style>
