<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '../../../../lib/components/ui/DataTable.svelte';
	import Modal from '../../../../lib/components/ui/Modal.svelte';
	import { listAuditLogs } from '../../../../lib/features/admin/api.js';
	import type { AuditLogRow } from '../../../../lib/features/admin/types.js';
	import { extractErrorMessage } from '../../../../lib/services/api-client.js';
	import { toasts } from '../../../../lib/stores/toast.js';

	let rows = $state<AuditLogRow[]>([]);
	let total = $state(0);
	let page = $state(1);
	let loading = $state(true);
	let entityType = $state('');

	let detailsOpen = $state(false);
	let activeRow = $state<AuditLogRow | null>(null);

	const columns: Column[] = [
		{ key: 'createdAt', label: 'When' },
		{ key: 'actor.email', label: 'Actor' },
		{ key: 'action', label: 'Action' },
		{ key: 'entityType', label: 'Entity' },
		{ key: 'entityId', label: 'Entity ID' }
	];

	async function load() {
		loading = true;
		try {
			const result = await listAuditLogs({
				page,
				pageSize: 20,
				entityType: entityType || undefined
			});
			rows = result.items.map((r) => ({ ...r, createdAt: new Date(r.createdAt).toLocaleString() }));
			total = result.total;
		} catch (err) {
			toasts.error('Could not load audit logs', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function viewDetails(row: AuditLogRow) {
		activeRow = row;
		detailsOpen = true;
	}
</script>

<svelte:head>
	<title>Audit Logs — Atyantik EMS</title>
</svelte:head>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
	<div>
		<h1 class="h4 fw-bold mb-1">Audit Logs</h1>
		<p class="text-muted-2 mb-0">
			A record of every create/update/delete action across the system.
		</p>
	</div>
	<input
		type="text"
		class="form-control form-control-sm"
		style="max-width: 220px;"
		placeholder="Filter by entity type…"
		bind:value={entityType}
		onchange={() => {
			page = 1;
			void load();
		}}
	/>
</div>

<div class="card border-0 shadow-sm">
	<div class="card-body">
		<DataTable
			{columns}
			{rows}
			rowKey={(row) => row.id}
			{loading}
			{total}
			{page}
			pageSize={20}
			searchable={false}
			emptyTitle="No audit log entries yet"
			onPageChange={(p) => {
				page = p;
				void load();
			}}
		>
			{#snippet rowActions(row)}
				<button
					type="button"
					class="btn btn-sm btn-outline-secondary"
					onclick={() => viewDetails(row)}
				>
					View diff
				</button>
			{/snippet}
		</DataTable>
	</div>
</div>

<Modal open={detailsOpen} title="Audit log entry" size="lg" onClose={() => (detailsOpen = false)}>
	{#if activeRow}
		<div class="mb-3 small">
			<div><span class="text-muted-2">Actor:</span> {activeRow.actor?.email ?? 'System'}</div>
			<div><span class="text-muted-2">Action:</span> {activeRow.action}</div>
			<div>
				<span class="text-muted-2">Entity:</span>
				{activeRow.entityType} ({activeRow.entityId})
			</div>
			<div><span class="text-muted-2">IP address:</span> {activeRow.ipAddress ?? '—'}</div>
		</div>
		<div class="row g-3">
			<div class="col-6">
				<div class="small fw-semibold mb-1">Before</div>
				<pre
					class="small bg-body-tertiary p-2 rounded"
					style="max-height: 300px; overflow: auto;">{JSON.stringify(activeRow.before, null, 2) ??
						'—'}</pre>
			</div>
			<div class="col-6">
				<div class="small fw-semibold mb-1">After</div>
				<pre
					class="small bg-body-tertiary p-2 rounded"
					style="max-height: 300px; overflow: auto;">{JSON.stringify(activeRow.after, null, 2) ??
						'—'}</pre>
			</div>
		</div>
	{/if}
</Modal>
