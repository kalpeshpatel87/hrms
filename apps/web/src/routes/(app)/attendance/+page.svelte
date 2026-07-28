<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '../../../lib/components/ui/DataTable.svelte';
	import Modal from '../../../lib/components/ui/Modal.svelte';
	import StatusBadge from '../../../lib/components/ui/StatusBadge.svelte';
	import {
		approveCorrectionRequest,
		breakIn,
		breakOut,
		checkIn,
		checkOut,
		getMyAttendance,
		listAllAttendance,
		listCorrectionRequests,
		rejectCorrectionRequest,
		updateAttendanceRecord
	} from '../../../lib/features/attendance/api.js';
	import type {
		AttendanceListItem,
		AttendanceRecord,
		CorrectionRequest,
		UpdateAttendanceInput
	} from '../../../lib/features/attendance/types.js';
	import { listAllDepartments } from '../../../lib/features/org/api.js';
	import type { Department } from '../../../lib/features/org/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { hasPermission } from '../../../lib/stores/auth.js';
	import { toasts } from '../../../lib/stores/toast.js';

	const canManageAttendance = hasPermission('attendance:approve');

	const now = new Date();
	let month = $state(now.getMonth() + 1);
	let year = $state(now.getFullYear());
	let records = $state<AttendanceRecord[]>([]);
	let loading = $state(true);
	let actionPending = $state(false);

	let adminTab = $state<'all' | 'corrections'>('all');
	let departments = $state<Department[]>([]);

	let allRows = $state<AttendanceListItem[]>([]);
	let allTotal = $state(0);
	let allPage = $state(1);
	let allLoading = $state(false);
	let departmentFilter = $state('');
	let statusFilter = $state('');
	let dateFrom = $state('');
	let dateTo = $state('');

	let corrections = $state<CorrectionRequest[]>([]);
	let correctionsTotal = $state(0);
	let correctionsPage = $state(1);
	let correctionsLoading = $state(false);

	let editModalOpen = $state(false);
	let editingId = $state('');
	let editForm = $state<UpdateAttendanceInput>({});
	let saving = $state(false);

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

	const allColumns: Column[] = [
		{ key: 'employee.employeeCode', label: 'Code', width: '100px' },
		{ key: 'employee.firstName', label: 'Employee' },
		{ key: 'date', label: 'Date' },
		{ key: 'checkInAt', label: 'Check in' },
		{ key: 'checkOutAt', label: 'Check out' },
		{ key: 'status', label: 'Status' }
	];

	const correctionColumns: Column[] = [
		{ key: 'employee.firstName', label: 'Employee' },
		{ key: 'requestedCheckInAt', label: 'Requested in' },
		{ key: 'requestedCheckOutAt', label: 'Requested out' },
		{ key: 'reason', label: 'Reason' },
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

	async function loadAllAttendance() {
		allLoading = true;
		try {
			const result = await listAllAttendance({
				page: allPage,
				pageSize: 10,
				departmentId: departmentFilter || undefined,
				status: (statusFilter || undefined) as AttendanceListItem['status'] | undefined,
				dateFrom: dateFrom || undefined,
				dateTo: dateTo || undefined
			});
			allRows = result.items;
			allTotal = result.total;
		} catch (err) {
			toasts.error('Could not load attendance records', extractErrorMessage(err));
		} finally {
			allLoading = false;
		}
	}

	async function loadCorrections() {
		correctionsLoading = true;
		try {
			const result = await listCorrectionRequests({ page: correctionsPage, pageSize: 10, status: 'PENDING' });
			corrections = result.items;
			correctionsTotal = result.total;
		} catch (err) {
			toasts.error('Could not load correction requests', extractErrorMessage(err));
		} finally {
			correctionsLoading = false;
		}
	}

	onMount(async () => {
		await load();
		if (canManageAttendance) {
			listAllDepartments()
				.then((d) => (departments = d))
				.catch(() => undefined);
			await Promise.all([loadAllAttendance(), loadCorrections()]);
		}
	});

	function openEditModal(row: AttendanceListItem) {
		editingId = row.id;
		editForm = {
			checkInAt: row.checkInAt?.slice(0, 16) ?? undefined,
			checkOutAt: row.checkOutAt?.slice(0, 16) ?? undefined,
			status: row.status,
			remarks: undefined
		};
		editModalOpen = true;
	}

	async function handleEditSubmit(event: SubmitEvent) {
		event.preventDefault();
		saving = true;
		try {
			await updateAttendanceRecord(editingId, editForm);
			toasts.success('Attendance record updated');
			editModalOpen = false;
			await loadAllAttendance();
		} catch (err) {
			toasts.error('Could not update attendance record', extractErrorMessage(err));
		} finally {
			saving = false;
		}
	}

	async function handleApproveCorrection(id: string) {
		try {
			await approveCorrectionRequest(id);
			toasts.success('Correction request approved');
			await Promise.all([loadCorrections(), loadAllAttendance()]);
		} catch (err) {
			toasts.error('Could not approve correction request', extractErrorMessage(err));
		}
	}

	async function handleRejectCorrection(id: string) {
		try {
			await rejectCorrectionRequest(id);
			toasts.success('Correction request rejected');
			await loadCorrections();
		} catch (err) {
			toasts.error('Could not reject correction request', extractErrorMessage(err));
		}
	}

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

{#if canManageAttendance}
	<div class="mt-4">
		<h2 class="h5 fw-bold mb-3">Manage Attendance</h2>
		<ul class="nav nav-tabs mb-3">
			<li class="nav-item">
				<button
					type="button"
					class="nav-link"
					class:active={adminTab === 'all'}
					onclick={() => (adminTab = 'all')}
				>
					All Attendance
				</button>
			</li>
			<li class="nav-item">
				<button
					type="button"
					class="nav-link"
					class:active={adminTab === 'corrections'}
					onclick={() => (adminTab = 'corrections')}
				>
					Correction Requests
					{#if correctionsTotal > 0}<span class="badge text-bg-warning ms-1">{correctionsTotal}</span
						>{/if}
				</button>
			</li>
		</ul>

		{#if adminTab === 'all'}
			<div class="card border-0 shadow-sm">
				<div class="card-body">
					<div class="row g-2 mb-3">
						<div class="col-auto">
							<select
								class="form-select form-select-sm"
								bind:value={departmentFilter}
								onchange={() => {
									allPage = 1;
									void loadAllAttendance();
								}}
							>
								<option value="">All departments</option>
								{#each departments as dept (dept.id)}
									<option value={dept.id}>{dept.name}</option>
								{/each}
							</select>
						</div>
						<div class="col-auto">
							<select
								class="form-select form-select-sm"
								bind:value={statusFilter}
								onchange={() => {
									allPage = 1;
									void loadAllAttendance();
								}}
							>
								<option value="">All statuses</option>
								<option value="PRESENT">Present</option>
								<option value="ABSENT">Absent</option>
								<option value="HALF_DAY">Half day</option>
								<option value="ON_LEAVE">On leave</option>
								<option value="HOLIDAY">Holiday</option>
								<option value="WEEK_OFF">Week off</option>
								<option value="LATE">Late</option>
								<option value="WORK_FROM_HOME">Work from home</option>
							</select>
						</div>
						<div class="col-auto">
							<input
								type="date"
								class="form-control form-control-sm"
								bind:value={dateFrom}
								onchange={() => {
									allPage = 1;
									void loadAllAttendance();
								}}
							/>
						</div>
						<div class="col-auto">
							<input
								type="date"
								class="form-control form-control-sm"
								bind:value={dateTo}
								onchange={() => {
									allPage = 1;
									void loadAllAttendance();
								}}
							/>
						</div>
					</div>
					<DataTable
						columns={allColumns}
						rows={allRows}
						rowKey={(row) => row.id}
						loading={allLoading}
						total={allTotal}
						page={allPage}
						pageSize={10}
						searchable={false}
						emptyTitle="No attendance records found"
						onPageChange={(p) => {
							allPage = p;
							void loadAllAttendance();
						}}
					>
						{#snippet rowActions(row)}
							<button
								type="button"
								class="btn btn-sm btn-outline-secondary"
								onclick={() => openEditModal(row)}
							>
								Edit
							</button>
						{/snippet}
					</DataTable>
				</div>
			</div>
		{:else}
			<div class="card border-0 shadow-sm">
				<div class="card-body">
					<DataTable
						columns={correctionColumns}
						rows={corrections}
						rowKey={(row) => row.id}
						loading={correctionsLoading}
						total={correctionsTotal}
						page={correctionsPage}
						pageSize={10}
						searchable={false}
						emptyTitle="No pending correction requests"
						onPageChange={(p) => {
							correctionsPage = p;
							void loadCorrections();
						}}
					>
						{#snippet rowActions(row)}
							<div class="d-flex gap-1 justify-content-end">
								<button
									type="button"
									class="btn btn-sm btn-success"
									onclick={() => handleApproveCorrection(row.id)}>Approve</button
								>
								<button
									type="button"
									class="btn btn-sm btn-outline-danger"
									onclick={() => handleRejectCorrection(row.id)}>Reject</button
								>
							</div>
						{/snippet}
					</DataTable>
				</div>
			</div>
		{/if}
	</div>
{/if}

<Modal open={editModalOpen} title="Edit Attendance Record" onClose={() => (editModalOpen = false)}>
	<form id="edit-attendance-form" onsubmit={handleEditSubmit}>
		<div class="row g-3 mb-3">
			<div class="col-6">
				<label for="editCheckIn" class="form-label small fw-semibold">Check in</label>
				<input
					id="editCheckIn"
					type="datetime-local"
					class="form-control"
					bind:value={editForm.checkInAt}
				/>
			</div>
			<div class="col-6">
				<label for="editCheckOut" class="form-label small fw-semibold">Check out</label>
				<input
					id="editCheckOut"
					type="datetime-local"
					class="form-control"
					bind:value={editForm.checkOutAt}
				/>
			</div>
			<div class="col-6">
				<label for="editStatus" class="form-label small fw-semibold">Status</label>
				<select id="editStatus" class="form-select" bind:value={editForm.status}>
					<option value="PRESENT">Present</option>
					<option value="ABSENT">Absent</option>
					<option value="HALF_DAY">Half day</option>
					<option value="ON_LEAVE">On leave</option>
					<option value="HOLIDAY">Holiday</option>
					<option value="WEEK_OFF">Week off</option>
					<option value="LATE">Late</option>
					<option value="WORK_FROM_HOME">Work from home</option>
				</select>
			</div>
		</div>
		<div class="mb-0">
			<label for="editRemarks" class="form-label small fw-semibold">Remarks (optional)</label>
			<textarea id="editRemarks" class="form-control" rows="2" bind:value={editForm.remarks}
			></textarea>
		</div>
	</form>

	{#snippet footer()}
		<button type="button" class="btn btn-outline-secondary" onclick={() => (editModalOpen = false)}
			>Cancel</button
		>
		<button type="submit" form="edit-attendance-form" class="btn btn-primary" disabled={saving}>
			{#if saving}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Save changes
		</button>
	{/snippet}
</Modal>
