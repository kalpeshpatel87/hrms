<script lang="ts">
	import { onMount } from 'svelte';
	import EmptyState from '../../../lib/components/ui/EmptyState.svelte';
	import {
		listMyNotifications,
		markAllAsRead,
		markAsRead
	} from '../../../lib/features/notification/api.js';
	import type { Notification } from '../../../lib/features/notification/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { toasts } from '../../../lib/stores/toast.js';

	let notifications = $state<Notification[]>([]);
	let loading = $state(true);
	let page = $state(1);
	let total = $state(0);
	const pageSize = 20;

	const iconFor: Record<string, string> = {
		LEAVE: 'bi-airplane',
		ATTENDANCE: 'bi-calendar-check',
		PAYROLL: 'bi-cash-coin',
		ANNOUNCEMENT: 'bi-megaphone',
		TICKET: 'bi-life-preserver',
		PERFORMANCE: 'bi-graph-up-arrow',
		RECRUITMENT: 'bi-person-badge',
		ASSET: 'bi-laptop',
		EXPENSE: 'bi-receipt',
		TRAVEL: 'bi-suitcase',
		ONBOARDING: 'bi-door-open',
		EXIT: 'bi-box-arrow-right',
		SYSTEM: 'bi-gear',
		GENERIC: 'bi-bell'
	};

	async function load() {
		loading = true;
		try {
			const result = await listMyNotifications({ page, pageSize });
			notifications = result.items;
			total = result.total;
		} catch (err) {
			toasts.error('Could not load notifications', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function handleMarkRead(notification: Notification) {
		if (notification.isRead) return;
		try {
			await markAsRead(notification.id);
			notification.isRead = true;
			notification.readAt = new Date().toISOString();
		} catch (err) {
			toasts.error('Could not mark as read', extractErrorMessage(err));
		}
	}

	async function handleMarkAllRead() {
		try {
			await markAllAsRead();
			toasts.success('All notifications marked as read');
			await load();
		} catch (err) {
			toasts.error('Could not mark all as read', extractErrorMessage(err));
		}
	}
</script>

<svelte:head>
	<title>Notifications — Atyantik EMS</title>
</svelte:head>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
	<div>
		<h1 class="h4 fw-bold mb-1">Notifications</h1>
		<p class="text-muted-2 mb-0">Everything relevant to you across the system.</p>
	</div>
	<button type="button" class="btn btn-outline-secondary btn-sm" onclick={handleMarkAllRead}>
		Mark all as read
	</button>
</div>

<div class="card border-0 shadow-sm">
	<div class="card-body">
		{#if loading}
			{#each [0, 1, 2] as skeletonRow (skeletonRow)}
				<div class="skeleton mb-2" style="height: 3rem;"></div>
			{/each}
		{:else if notifications.length === 0}
			<EmptyState icon="bi-bell" title="No notifications" />
		{:else}
			<ul class="list-unstyled d-flex flex-column gap-1 mb-0">
				{#each notifications as notification (notification.id)}
					<li>
						<button
							type="button"
							class="notification-row d-flex gap-3 w-100 text-start border-0 bg-transparent"
							class:is-unread={!notification.isRead}
							onclick={() => handleMarkRead(notification)}
						>
							<i class="bi {iconFor[notification.type] ?? 'bi-bell'} mt-1"></i>
							<div class="flex-grow-1">
								<div class="fw-semibold small">{notification.title}</div>
								{#if notification.body}
									<div class="text-muted-2 small">{notification.body}</div>
								{/if}
								<div class="text-muted-2 small">
									{new Date(notification.createdAt).toLocaleString()}
								</div>
							</div>
							{#if !notification.isRead}
								<span class="unread-dot" aria-label="Unread"></span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
			{#if total > pageSize}
				<div class="d-flex justify-content-between align-items-center pt-2">
					<span class="text-muted-2 small">Page {page} of {Math.ceil(total / pageSize)}</span>
					<div class="btn-group btn-group-sm">
						<button
							type="button"
							class="btn btn-outline-secondary"
							disabled={page <= 1}
							onclick={() => {
								page -= 1;
								void load();
							}}
						>
							Previous
						</button>
						<button
							type="button"
							class="btn btn-outline-secondary"
							disabled={page >= Math.ceil(total / pageSize)}
							onclick={() => {
								page += 1;
								void load();
							}}
						>
							Next
						</button>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style lang="scss">
	.notification-row {
		padding: 0.6rem 0.5rem;
		border-radius: 0.5rem;

		&.is-unread {
			background: var(--surface-sunken);
		}

		&:hover {
			background: var(--surface-sunken);
		}
	}

	.unread-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--bs-primary);
		flex-shrink: 0;
		margin-top: 0.4rem;
	}
</style>
