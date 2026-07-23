<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import EmptyState from '../../../../lib/components/ui/EmptyState.svelte';
	import StatusBadge from '../../../../lib/components/ui/StatusBadge.svelte';
	import { addComment, getTicket, listComments } from '../../../../lib/features/helpdesk/api.js';
	import type { Ticket, TicketComment } from '../../../../lib/features/helpdesk/types.js';
	import { extractErrorMessage } from '../../../../lib/services/api-client.js';
	import { toasts } from '../../../../lib/stores/toast.js';

	let ticket = $state<Ticket | null>(null);
	let comments = $state<TicketComment[]>([]);
	let loading = $state(true);
	let newComment = $state('');
	let submitting = $state(false);

	async function load() {
		loading = true;
		try {
			const id = page.params.id as string;
			const [t, c] = await Promise.all([getTicket(id), listComments(id)]);
			ticket = t;
			comments = c;
		} catch (err) {
			toasts.error('Could not load ticket', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function handleAddComment(event: SubmitEvent) {
		event.preventDefault();
		if (!newComment.trim()) return;
		submitting = true;
		try {
			await addComment(page.params.id as string, newComment);
			newComment = '';
			comments = await listComments(page.params.id as string);
		} catch (err) {
			toasts.error('Could not add comment', extractErrorMessage(err));
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{ticket ? ticket.ticketNumber : 'Ticket'} — Atyantik EMS</title>
</svelte:head>

<a href="/helpdesk" class="d-inline-flex align-items-center gap-1 mb-3 small">
	<i class="bi bi-arrow-left"></i> Back to tickets
</a>

{#if loading}
	<div class="skeleton" style="height: 200px;"></div>
{:else if !ticket}
	<EmptyState icon="bi-life-preserver" title="Ticket not found" />
{:else}
	<div class="card border-0 shadow-sm mb-3">
		<div class="card-body">
			<div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
				<div>
					<div class="text-muted-2 small">{ticket.ticketNumber}</div>
					<h1 class="h5 fw-bold mb-1">{ticket.subject}</h1>
					<div class="d-flex gap-2">
						<StatusBadge status={ticket.status} />
						<span class="badge text-bg-light border">{ticket.category}</span>
						<span class="badge text-bg-light border">{ticket.priority}</span>
					</div>
				</div>
			</div>
			{#if ticket.description}
				<p class="mt-3 mb-0">{ticket.description}</p>
			{/if}
		</div>
	</div>

	<div class="card border-0 shadow-sm">
		<div class="card-body">
			<h2 class="h6 fw-bold mb-3">Comments</h2>
			{#if comments.length === 0}
				<p class="text-muted-2 small">No comments yet.</p>
			{:else}
				<ul class="list-unstyled d-flex flex-column gap-3 mb-3">
					{#each comments as comment (comment.id)}
						<li>
							<div class="d-flex justify-content-between">
								<span class="fw-semibold small">{comment.author.email}</span>
								<span class="text-muted-2 small"
									>{new Date(comment.createdAt).toLocaleString()}</span
								>
							</div>
							<p class="mb-0 small">{comment.body}</p>
						</li>
					{/each}
				</ul>
			{/if}

			<form onsubmit={handleAddComment} class="d-flex gap-2">
				<input
					type="text"
					class="form-control"
					placeholder="Add a comment…"
					bind:value={newComment}
					required
				/>
				<button type="submit" class="btn btn-primary" disabled={submitting}>Send</button>
			</form>
		</div>
	</div>
{/if}
