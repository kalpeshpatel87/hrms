<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '../../../lib/components/ui/DataTable.svelte';
	import StatusBadge from '../../../lib/components/ui/StatusBadge.svelte';
	import {
		breakIn,
		breakOut,
		checkIn,
		checkOut,
		getMyAttendance
	} from '../../../lib/features/attendance/api.js';
	import type { AttendanceRecord } from '../../../lib/features/attendance/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { toasts } from '../../../lib/stores/toast.js';

	const now = new Date();
	let month = $state(now.getMonth() + 1);
	let year = $state(now.getFullYear());
	let records = $state<AttendanceRecord[]>([]);
	let loading = $state(true);
	let actionPending = $state(false);

	const todayIso = now.toISOString().slice(0, 10);
	const today = $derived(records.find((r) => r.date.slice(0, 10) === todayIso));
	const onOpenBreak = $derived(Boolean(today?.checkInAt && !today?.checkOutAt));

	const columns: Column[] = [
		{ key: 'date', label: 'Date' },
		{ key: 'checkInAt', label: 'Check in' },
		{ key: 'checkOutAt', label: 'Check out' },
		{ key: 'totalWorkMinutes', label: 'Worked (min)', align: 'center' },
		{ key: 'status', label: 'Status' }
	];

	async function load() {
		loading = true;
		try {
			records = await getMyAttendance(month, year);
		} catch (err) {
			toasts.error('Could not load attendance', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function withGeolocation(): Promise<{ lat: number; lng: number } | undefined> {
		return new Promise((resolve) => {
			if (!navigator.geolocation) return resolve(undefined);
			navigator.geolocation.getCurrentPosition(
				(pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
				() => resolve(undefined),
				{ timeout: 3000 }
			);
		});
	}

	async function handleCheckIn() {
		actionPending = true;
		try {
			const coords = await withGeolocation();
			await checkIn(coords);
			toasts.success('Checked in');
			await load();
		} catch (err) {
			toasts.error('Check-in failed', extractErrorMessage(err));
		} finally {
			actionPending = false;
		}
	}

	async function handleCheckOut() {
		actionPending = true;
		try {
			const coords = await withGeolocation();
			await checkOut(coords);
			toasts.success('Checked out');
			await load();
		} catch (err) {
			toasts.error('Check-out failed', extractErrorMessage(err));
		} finally {
			actionPending = false;
		}
	}

	async function handleBreak() {
		actionPending = true;
		try {
			if (onOpenBreak) {
				await breakOut();
				toasts.success('Break ended');
			} else {
				await breakIn();
				toasts.success('Break started');
			}
			await load();
		} catch (err) {
			toasts.error('Could not update break', extractErrorMessage(err));
		} finally {
			actionPending = false;
		}
	}
</script>

<svelte:head>
	<title>Attendance — Atyantik EMS</title>
</svelte:head>

<div class="mb-3">
	<h1 class="h4 fw-bold mb-1">Attendance</h1>
	<p class="text-muted-2 mb-0">Track your daily check-in/out and monthly attendance.</p>
</div>

<div class="card border-0 shadow-sm mb-3">
	<div class="card-body d-flex flex-wrap align-items-center gap-3">
		<div class="flex-grow-1">
			<div class="fw-semibold">Today</div>
			{#if today}
				<div class="text-muted-2 small">
					In: {today.checkInAt ? new Date(today.checkInAt).toLocaleTimeString() : '—'}
					· Out: {today.checkOutAt ? new Date(today.checkOutAt).toLocaleTimeString() : '—'}
				</div>
				<StatusBadge status={today.status} />
			{:else}
				<div class="text-muted-2 small">You haven't checked in today.</div>
			{/if}
		</div>
		<div class="d-flex gap-2">
			{#if !today?.checkInAt}
				<button
					type="button"
					class="btn btn-success"
					disabled={actionPending}
					onclick={handleCheckIn}
				>
					<i class="bi bi-box-arrow-in-right me-1"></i>Check in
				</button>
			{:else if !today.checkOutAt}
				<button
					type="button"
					class="btn btn-outline-secondary"
					disabled={actionPending}
					onclick={handleBreak}
				>
					{onOpenBreak ? 'End break' : 'Start break'}
				</button>
				<button
					type="button"
					class="btn btn-danger"
					disabled={actionPending}
					onclick={handleCheckOut}
				>
					<i class="bi bi-box-arrow-right me-1"></i>Check out
				</button>
			{:else}
				<span class="badge text-bg-success">Day complete</span>
			{/if}
		</div>
	</div>
</div>

<div class="card border-0 shadow-sm">
	<div class="card-body">
		<div class="d-flex justify-content-between align-items-center mb-3">
			<h2 class="h6 fw-bold mb-0">Monthly record</h2>
			<input
				type="month"
				class="form-control form-control-sm"
				style="max-width: 160px;"
				value={`${year}-${String(month).padStart(2, '0')}`}
				onchange={(e) => {
					const [y, m] = (e.currentTarget as HTMLInputElement).value.split('-').map(Number);
					year = y;
					month = m;
					void load();
				}}
			/>
		</div>
		<DataTable
			{columns}
			rows={records}
			rowKey={(row) => row.id}
			{loading}
			searchable={false}
			emptyTitle="No records this month"
		/>
	</div>
</div>
