<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '../../../lib/components/ui/DataTable.svelte';
	import Modal from '../../../lib/components/ui/Modal.svelte';
	import {
		downloadDocument,
		listMyDocuments,
		uploadDocument
	} from '../../../lib/features/document/api.js';
	import type { DocumentCategory, DocumentRow } from '../../../lib/features/document/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { toasts } from '../../../lib/stores/toast.js';
	import { triggerBlobDownload } from '../../../lib/utils/download.js';

	let rows = $state<DocumentRow[]>([]);
	let total = $state(0);
	let page = $state(1);
	let loading = $state(true);

	let modalOpen = $state(false);
	let submitting = $state(false);
	let title = $state('');
	let category = $state<DocumentCategory>('OTHER');
	let isConfidential = $state(false);
	let fileInput: HTMLInputElement | undefined = $state();

	const columns: Column[] = [
		{ key: 'title', label: 'Title' },
		{ key: 'category', label: 'Category' },
		{ key: 'createdAt', label: 'Uploaded' }
	];

	async function load() {
		loading = true;
		try {
			const result = await listMyDocuments({ page, pageSize: 20 });
			rows = result.items;
			total = result.total;
		} catch (err) {
			toasts.error('Could not load documents', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function handleUpload(event: SubmitEvent) {
		event.preventDefault();
		const file = fileInput?.files?.[0];
		if (!file) {
			toasts.error('Please choose a file');
			return;
		}
		submitting = true;
		try {
			await uploadDocument(file, { title, category, isConfidential });
			toasts.success('Document uploaded');
			modalOpen = false;
			title = '';
			category = 'OTHER';
			isConfidential = false;
			await load();
		} catch (err) {
			toasts.error('Could not upload document', extractErrorMessage(err));
		} finally {
			submitting = false;
		}
	}

	async function handleDownload(row: DocumentRow) {
		try {
			const blob = await downloadDocument(row.id);
			const extension = row.currentVersion?.mimeType?.split('/')[1] ?? 'bin';
			triggerBlobDownload(blob, `${row.title}.${extension}`);
		} catch (err) {
			toasts.error('Could not download document', extractErrorMessage(err));
		}
	}
</script>

<svelte:head>
	<title>Documents — Atyantik EMS</title>
</svelte:head>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
	<div>
		<h1 class="h4 fw-bold mb-1">Documents</h1>
		<p class="text-muted-2 mb-0">Your personal document vault.</p>
	</div>
	<button type="button" class="btn btn-primary btn-sm" onclick={() => (modalOpen = true)}>
		<i class="bi bi-upload me-1"></i>Upload
	</button>
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
			emptyTitle="No documents uploaded yet"
			onPageChange={(p) => {
				page = p;
				void load();
			}}
		>
			{#snippet rowActions(row)}
				<button
					type="button"
					class="btn btn-sm btn-outline-secondary"
					onclick={() => handleDownload(row)}
				>
					<i class="bi bi-download me-1"></i>Download
				</button>
			{/snippet}
		</DataTable>
	</div>
</div>

<Modal open={modalOpen} title="Upload Document" onClose={() => (modalOpen = false)}>
	<form id="document-form" onsubmit={handleUpload}>
		<div class="mb-3">
			<label for="title" class="form-label small fw-semibold">Title</label>
			<input id="title" type="text" class="form-control" bind:value={title} required />
		</div>
		<div class="mb-3">
			<label for="category" class="form-label small fw-semibold">Category</label>
			<select id="category" class="form-select" bind:value={category}>
				<option value="ID_PROOF">ID Proof</option>
				<option value="ADDRESS_PROOF">Address Proof</option>
				<option value="EDUCATIONAL">Educational</option>
				<option value="EXPERIENCE">Experience</option>
				<option value="OFFER_LETTER">Offer Letter</option>
				<option value="CONTRACT">Contract</option>
				<option value="PAYSLIP">Payslip</option>
				<option value="POLICY">Policy</option>
				<option value="OTHER">Other</option>
			</select>
		</div>
		<div class="mb-3">
			<label for="file" class="form-label small fw-semibold">File</label>
			<input id="file" type="file" class="form-control" bind:this={fileInput} required />
		</div>
		<div class="form-check">
			<input
				id="isConfidential"
				type="checkbox"
				class="form-check-input"
				bind:checked={isConfidential}
			/>
			<label for="isConfidential" class="form-check-label small">Mark as confidential</label>
		</div>
	</form>

	{#snippet footer()}
		<button type="button" class="btn btn-outline-secondary" onclick={() => (modalOpen = false)}
			>Cancel</button
		>
		<button type="submit" form="document-form" class="btn btn-primary" disabled={submitting}>
			{#if submitting}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Upload
		</button>
	{/snippet}
</Modal>
