<script lang="ts">
	import { onMount } from 'svelte';
	import EmptyState from '../../../lib/components/ui/EmptyState.svelte';
	import Modal from '../../../lib/components/ui/Modal.svelte';
	import {
		createAnnouncement,
		deleteAnnouncement,
		listAnnouncements,
		type CreateAnnouncementInput
	} from '../../../lib/features/announcement/api.js';
	import type { Announcement } from '../../../lib/features/announcement/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { hasPermission } from '../../../lib/stores/auth.js';
	import { toasts } from '../../../lib/stores/toast.js';

	const canManage = hasPermission('announcement:create');

	let announcements = $state<Announcement[]>([]);
	let loading = $state(true);
	let createModalOpen = $state(false);
	let submitting = $state(false);
	let form = $state<CreateAnnouncementInput>({ title: '', body: '', isPinned: false });

	async function load() {
		loading = true;
		try {
			const result = await listAnnouncements({ page: 1, pageSize: 50 });
			announcements = result.items;
		} catch (err) {
			toasts.error('Could not load announcements', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function handleCreate(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		try {
			await createAnnouncement(form);
			toasts.success('Announcement published');
			createModalOpen = false;
			form = { title: '', body: '', isPinned: false };
			await load();
		} catch (err) {
			toasts.error('Could not publish announcement', extractErrorMessage(err));
		} finally {
			submitting = false;
		}
	}

	async function handleDelete(id: string) {
		try {
			await deleteAnnouncement(id);
			toasts.success('Announcement deleted');
			await load();
		} catch (err) {
			toasts.error('Could not delete announcement', extractErrorMessage(err));
		}
	}
</script>

<svelte:head>
	<title>Announcements — Atyantik EMS</title>
</svelte:head>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
	<div>
		<h1 class="h4 fw-bold mb-1">Announcements</h1>
		<p class="text-muted-2 mb-0">Company news, policy updates, and events.</p>
	</div>
	{#if canManage}
		<button type="button" class="btn btn-primary btn-sm" onclick={() => (createModalOpen = true)}>
			<i class="bi bi-plus-lg me-1"></i>New Announcement
		</button>
	{/if}
</div>

{#if loading}
	{#each [0, 1, 2] as skeletonRow (skeletonRow)}
		<div class="skeleton mb-3" style="height: 5rem;"></div>
	{/each}
{:else if announcements.length === 0}
	<EmptyState icon="bi-megaphone" title="No announcements yet" />
{:else}
	<div class="d-flex flex-column gap-3">
		{#each announcements as announcement (announcement.id)}
			<div class="card border-0 shadow-sm">
				<div class="card-body">
					<div class="d-flex justify-content-between align-items-start gap-2">
						<div>
							<div class="d-flex align-items-center gap-2 mb-1">
								{#if announcement.isPinned}
									<i class="bi bi-pin-angle-fill text-primary"></i>
								{/if}
								<h2 class="h6 fw-bold mb-0">{announcement.title}</h2>
							</div>
							<div class="text-muted-2 small mb-2">
								{new Date(announcement.publishAt).toLocaleDateString()} · {announcement.audience
									.replaceAll('_', ' ')
									.toLowerCase()}
							</div>
						</div>
						{#if canManage}
							<button
								type="button"
								class="btn btn-sm btn-outline-danger"
								onclick={() => handleDelete(announcement.id)}
								aria-label="Delete announcement"
							>
								<i class="bi bi-trash"></i>
							</button>
						{/if}
					</div>
					<p class="mb-0">{announcement.body}</p>
				</div>
			</div>
		{/each}
	</div>
{/if}

<Modal open={createModalOpen} title="New Announcement" onClose={() => (createModalOpen = false)}>
	<form id="create-announcement-form" onsubmit={handleCreate}>
		<div class="mb-3">
			<label for="title" class="form-label small fw-semibold">Title</label>
			<input id="title" type="text" class="form-control" bind:value={form.title} required />
		</div>
		<div class="mb-3">
			<label for="body" class="form-label small fw-semibold">Content</label>
			<textarea id="body" class="form-control" rows="5" bind:value={form.body} required></textarea>
		</div>
		<div class="form-check">
			<input id="isPinned" type="checkbox" class="form-check-input" bind:checked={form.isPinned} />
			<label for="isPinned" class="form-check-label small">Pin this announcement</label>
		</div>
	</form>

	{#snippet footer()}
		<button
			type="button"
			class="btn btn-outline-secondary"
			onclick={() => (createModalOpen = false)}>Cancel</button
		>
		<button
			type="submit"
			form="create-announcement-form"
			class="btn btn-primary"
			disabled={submitting}
		>
			{#if submitting}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Publish
		</button>
	{/snippet}
</Modal>
