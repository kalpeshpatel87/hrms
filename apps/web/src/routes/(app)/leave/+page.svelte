<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '../../../lib/components/ui/DataTable.svelte';
	import Modal from '../../../lib/components/ui/Modal.svelte';
	import { listEmployees } from '../../../lib/features/employee/api.js';
	import type { EmployeeListItem } from '../../../lib/features/employee/types.js';
	import {
		approveLeaveRequest,
		cancelLeaveRequest,
		createLeaveRequest,
		createLeaveRequestForAdmin,
		getMyLeaveBalances,
		listLeaveTypes,
		listMyLeaveRequests,
		listPendingApprovals,
		rejectLeaveRequest
	} from '../../../lib/features/leave/api.js';
	import type {
		CreateLeaveRequestInput,
		LeaveApproval,
		LeaveBalance,
		LeaveRequest,
		LeaveType
	} from '../../../lib/features/leave/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { hasPermission } from '../../../lib/stores/auth.js';
	import { toasts } from '../../../lib/stores/toast.js';

	let activeTab = $state<'requests' | 'approvals'>('requests');
	const canApprove = hasPermission('leave:approve');
	const canApplyForOthers = hasPermission('leave:create');

	let employees = $state<EmployeeListItem[]>([]);
	let onBehalfOfEmployeeId = $state('');

	let balances = $state<LeaveBalance[]>([]);
	let leaveTypes = $state<LeaveType[]>([]);
	let requests = $state<LeaveRequest[]>([]);
	let requestsTotal = $state(0);
	let requestsPage = $state(1);
	let loadingRequests = $state(true);

	let approvals = $state<LeaveApproval[]>([]);
	let approvalsTotal = $state(0);
	let approvalsPage = $state(1);
	let loadingApprovals = $state(false);

	let applyModalOpen = $state(false);
	let applyMode = $state<'self' | 'admin'>('self');
	let submitting = $state(false);
	let form = $state<CreateLeaveRequestInput>({
		leaveTypeId: '',
		startDate: '',
		endDate: '',
		reason: ''
	});

	const requestColumns: Column[] = [
		{ key: 'leaveType.name', label: 'Type' },
		{ key: 'startDate', label: 'Start' },
		{ key: 'endDate', label: 'End' },
		{ key: 'totalDays', label: 'Days', align: 'center' },
		{ key: 'status', label: 'Status' }
	];

	const approvalColumns: Column[] = [
		{ key: 'leaveRequest.employee.firstName', label: 'Employee' },
		{ key: 'leaveRequest.leaveType.name', label: 'Type' },
		{ key: 'leaveRequest.startDate', label: 'Start' },
		{ key: 'leaveRequest.endDate', label: 'End' },
		{ key: 'leaveRequest.totalDays', label: 'Days', align: 'center' }
	];

	async function loadBalancesAndTypes() {
		const [b, t] = await Promise.all([getMyLeaveBalances(), listLeaveTypes()]);
		balances = b;
		leaveTypes = t;
	}

	async function loadRequests() {
		loadingRequests = true;
		try {
			const result = await listMyLeaveRequests({ page: requestsPage, pageSize: 10 });
			requests = result.items;
			requestsTotal = result.total;
		} catch (err) {
			toasts.error('Could not load leave requests', extractErrorMessage(err));
		} finally {
			loadingRequests = false;
		}
	}

	async function loadApprovals() {
		if (!canApprove) return;
		loadingApprovals = true;
		try {
			const result = await listPendingApprovals({ page: approvalsPage, pageSize: 10 });
			approvals = result.items;
			approvalsTotal = result.total;
		} catch (err) {
			toasts.error('Could not load approval queue', extractErrorMessage(err));
		} finally {
			loadingApprovals = false;
		}
	}

	onMount(async () => {
		const tasks = [loadBalancesAndTypes(), loadRequests(), loadApprovals()];
		if (canApplyForOthers) {
			tasks.push(
				listEmployees({ page: 1, pageSize: 200 }).then((result) => {
					employees = result.items;
				})
			);
		}
		await Promise.all(tasks);
	});

	function openApplyModal(mode: 'self' | 'admin') {
		applyMode = mode;
		onBehalfOfEmployeeId = '';
		form = { leaveTypeId: '', startDate: '', endDate: '', reason: '' };
		applyModalOpen = true;
	}

	async function handleApplySubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		try {
			if (applyMode === 'admin') {
				await createLeaveRequestForAdmin({ ...form, employeeId: onBehalfOfEmployeeId });
				toasts.success('Leave request submitted on behalf of the employee');
			} else {
				await createLeaveRequest(form);
				toasts.success('Leave request submitted');
			}
			applyModalOpen = false;
			form = { leaveTypeId: '', startDate: '', endDate: '', reason: '' };
			await Promise.all([loadRequests(), loadBalancesAndTypes()]);
		} catch (err) {
			toasts.error('Could not submit leave request', extractErrorMessage(err));
		} finally {
			submitting = false;
		}
	}

	async function handleCancel(id: string) {
		try {
			await cancelLeaveRequest(id);
			toasts.success('Leave request cancelled');
			await Promise.all([loadRequests(), loadBalancesAndTypes()]);
		} catch (err) {
			toasts.error('Could not cancel request', extractErrorMessage(err));
		}
	}

	async function handleApprove(id: string) {
		try {
			await approveLeaveRequest(id);
			toasts.success('Leave request approved');
			await loadApprovals();
		} catch (err) {
			toasts.error('Could not approve request', extractErrorMessage(err));
		}
	}

	async function handleReject(id: string) {
		try {
			await rejectLeaveRequest(id);
			toasts.success('Leave request rejected');
			await loadApprovals();
		} catch (err) {
			toasts.error('Could not reject request', extractErrorMessage(err));
		}
	}
</script>

<svelte:head>
	<title>Leave — Atyantik EMS</title>
</svelte:head>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
	<div>
		<h1 class="h4 fw-bold mb-1">Leave</h1>
		<p class="text-muted-2 mb-0">Apply for leave and track your balances.</p>
	</div>
	<div class="d-flex gap-2">
		{#if canApplyForOthers}
			<button
				type="button"
				class="btn btn-outline-primary btn-sm"
				onclick={() => openApplyModal('admin')}
			>
				<i class="bi bi-person-plus me-1"></i>Apply on Behalf of Employee
			</button>
		{/if}
		<button type="button" class="btn btn-primary btn-sm" onclick={() => openApplyModal('self')}>
			<i class="bi bi-plus-lg me-1"></i>Apply for Leave
		</button>
	</div>
</div>

<div class="row g-3 mb-3">
	{#each balances as balance (balance.id)}
		<div class="col-6 col-lg-3">
			<div class="stat-card">
				<span class="stat-card-label">{balance.leaveType.name}</span>
				<span class="stat-card-value">{balance.available}</span>
				<span class="text-muted-2 small">of {balance.allocated} days</span>
			</div>
		</div>
	{/each}
</div>

{#if canApprove}
	<ul class="nav nav-tabs mb-3">
		<li class="nav-item">
			<button
				type="button"
				class="nav-link"
				class:active={activeTab === 'requests'}
				onclick={() => (activeTab = 'requests')}
			>
				My Requests
			</button>
		</li>
		<li class="nav-item">
			<button
				type="button"
				class="nav-link"
				class:active={activeTab === 'approvals'}
				onclick={() => (activeTab = 'approvals')}
			>
				Approval Queue
				{#if approvalsTotal > 0}<span class="badge text-bg-warning ms-1">{approvalsTotal}</span
					>{/if}
			</button>
		</li>
	</ul>
{/if}

{#if activeTab === 'requests' || !canApprove}
	<div class="card border-0 shadow-sm">
		<div class="card-body">
			<DataTable
				columns={requestColumns}
				rows={requests}
				rowKey={(row) => row.id}
				loading={loadingRequests}
				total={requestsTotal}
				page={requestsPage}
				pageSize={10}
				searchable={false}
				emptyTitle="No leave requests yet"
				onPageChange={(p) => {
					requestsPage = p;
					void loadRequests();
				}}
			>
				{#snippet rowActions(row)}
					{#if row.status === 'PENDING' || row.status === 'APPROVED'}
						<button
							type="button"
							class="btn btn-sm btn-outline-danger"
							onclick={() => handleCancel(row.id)}
						>
							Cancel
						</button>
					{/if}
				{/snippet}
			</DataTable>
		</div>
	</div>
{:else}
	<div class="card border-0 shadow-sm">
		<div class="card-body">
			<DataTable
				columns={approvalColumns}
				rows={approvals}
				rowKey={(row) => row.id}
				loading={loadingApprovals}
				total={approvalsTotal}
				page={approvalsPage}
				pageSize={10}
				searchable={false}
				emptyTitle="No pending approvals"
				onPageChange={(p) => {
					approvalsPage = p;
					void loadApprovals();
				}}
			>
				{#snippet rowActions(row)}
					<div class="d-flex gap-1 justify-content-end">
						<button
							type="button"
							class="btn btn-sm btn-success"
							onclick={() => handleApprove(row.id)}>Approve</button
						>
						<button
							type="button"
							class="btn btn-sm btn-outline-danger"
							onclick={() => handleReject(row.id)}>Reject</button
						>
					</div>
				{/snippet}
			</DataTable>
		</div>
	</div>
{/if}

<Modal
	open={applyModalOpen}
	title={applyMode === 'admin' ? 'Apply on Behalf of Employee' : 'Apply for Leave'}
	onClose={() => (applyModalOpen = false)}
>
	<form id="apply-leave-form" onsubmit={handleApplySubmit}>
		{#if applyMode === 'admin'}
			<div class="mb-3">
				<label for="onBehalfOf" class="form-label small fw-semibold">Employee</label>
				<select id="onBehalfOf" class="form-select" bind:value={onBehalfOfEmployeeId} required>
					<option value="" disabled>Select an employee</option>
					{#each employees as employee (employee.id)}
						<option value={employee.id}
							>{employee.firstName} {employee.lastName} ({employee.employeeCode})</option
						>
					{/each}
				</select>
			</div>
		{/if}
		<div class="mb-3">
			<label for="leaveType" class="form-label small fw-semibold">Leave type</label>
			<select id="leaveType" class="form-select" bind:value={form.leaveTypeId} required>
				<option value="" disabled>Select a leave type</option>
				{#each leaveTypes as type (type.id)}
					<option value={type.id}>{type.name}</option>
				{/each}
			</select>
		</div>
		<div class="row g-3 mb-3">
			<div class="col-6">
				<label for="startDate" class="form-label small fw-semibold">Start date</label>
				<input
					id="startDate"
					type="date"
					class="form-control"
					bind:value={form.startDate}
					required
				/>
			</div>
			<div class="col-6">
				<label for="endDate" class="form-label small fw-semibold">End date</label>
				<input id="endDate" type="date" class="form-control" bind:value={form.endDate} required />
			</div>
		</div>
		<div class="mb-0">
			<label for="reason" class="form-label small fw-semibold">Reason (optional)</label>
			<textarea id="reason" class="form-control" rows="3" bind:value={form.reason}></textarea>
		</div>
	</form>

	{#snippet footer()}
		<button type="button" class="btn btn-outline-secondary" onclick={() => (applyModalOpen = false)}
			>Cancel</button
		>
		<button type="submit" form="apply-leave-form" class="btn btn-primary" disabled={submitting}>
			{#if submitting}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Submit request
		</button>
	{/snippet}
</Modal>
