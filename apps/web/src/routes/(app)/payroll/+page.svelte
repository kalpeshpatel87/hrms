<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type Column } from '../../../lib/components/ui/DataTable.svelte';
	import {
		approvePayrollRun,
		generatePayrollRun,
		listMyPayslips,
		listPayrollRuns,
		downloadPayslip
	} from '../../../lib/features/payroll/api.js';
	import type { PayrollRun, Payslip } from '../../../lib/features/payroll/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { hasPermission } from '../../../lib/stores/auth.js';
	import { toasts } from '../../../lib/stores/toast.js';
	import { triggerBlobDownload } from '../../../lib/utils/download.js';

	const canManagePayroll = hasPermission('payroll:create');
	let activeTab = $state<'payslips' | 'runs'>('payslips');

	let payslips = $state<Payslip[]>([]);
	let payslipsTotal = $state(0);
	let payslipsPage = $state(1);
	let loadingPayslips = $state(true);

	let runs = $state<PayrollRun[]>([]);
	let runsTotal = $state(0);
	let runsPage = $state(1);
	let loadingRuns = $state(false);
	let generating = $state(false);

	const now = new Date();
	let runMonth = $state(now.getMonth() + 1);
	let runYear = $state(now.getFullYear());

	const payslipColumns: Column[] = [
		{ key: 'month', label: 'Month', align: 'center' },
		{ key: 'year', label: 'Year', align: 'center' },
		{ key: 'grossEarnings', label: 'Gross', align: 'end' },
		{ key: 'totalDeductions', label: 'Deductions', align: 'end' },
		{ key: 'netPay', label: 'Net Pay', align: 'end' }
	];

	const runColumns: Column[] = [
		{ key: 'month', label: 'Month', align: 'center' },
		{ key: 'year', label: 'Year', align: 'center' },
		{ key: 'employeeCount', label: 'Employees', align: 'center' },
		{ key: 'totalNet', label: 'Total Net', align: 'end' },
		{ key: 'status', label: 'Status' }
	];

	async function loadPayslips() {
		loadingPayslips = true;
		try {
			const result = await listMyPayslips({ page: payslipsPage, pageSize: 12 });
			payslips = result.items;
			payslipsTotal = result.total;
		} catch (err) {
			toasts.error('Could not load payslips', extractErrorMessage(err));
		} finally {
			loadingPayslips = false;
		}
	}

	async function loadRuns() {
		if (!canManagePayroll) return;
		loadingRuns = true;
		try {
			const result = await listPayrollRuns({ page: runsPage, pageSize: 12 });
			runs = result.items;
			runsTotal = result.total;
		} catch (err) {
			toasts.error('Could not load payroll runs', extractErrorMessage(err));
		} finally {
			loadingRuns = false;
		}
	}

	onMount(async () => {
		await Promise.all([loadPayslips(), loadRuns()]);
	});

	async function handleDownload(payslip: Payslip) {
		try {
			const blob = await downloadPayslip(payslip.id);
			triggerBlobDownload(blob, `payslip-${payslip.month}-${payslip.year}.pdf`);
		} catch (err) {
			toasts.error('Could not download payslip', extractErrorMessage(err));
		}
	}

	async function handleGenerateRun() {
		generating = true;
		try {
			await generatePayrollRun(runMonth, runYear);
			toasts.success('Payroll run generated');
			await loadRuns();
		} catch (err) {
			toasts.error('Could not generate payroll run', extractErrorMessage(err));
		} finally {
			generating = false;
		}
	}

	async function handleApproveRun(id: string) {
		try {
			await approvePayrollRun(id);
			toasts.success('Payroll run approved');
			await loadRuns();
		} catch (err) {
			toasts.error('Could not approve payroll run', extractErrorMessage(err));
		}
	}
</script>

<svelte:head>
	<title>Payroll — Atyantik EMS</title>
</svelte:head>

<div class="mb-3">
	<h1 class="h4 fw-bold mb-1">Payroll</h1>
	<p class="text-muted-2 mb-0">View and download your payslips.</p>
</div>

{#if canManagePayroll}
	<ul class="nav nav-tabs mb-3">
		<li class="nav-item">
			<button
				type="button"
				class="nav-link"
				class:active={activeTab === 'payslips'}
				onclick={() => (activeTab = 'payslips')}
			>
				My Payslips
			</button>
		</li>
		<li class="nav-item">
			<button
				type="button"
				class="nav-link"
				class:active={activeTab === 'runs'}
				onclick={() => (activeTab = 'runs')}
			>
				Payroll Runs
			</button>
		</li>
	</ul>
{/if}

{#if activeTab === 'payslips' || !canManagePayroll}
	<div class="card border-0 shadow-sm">
		<div class="card-body">
			<DataTable
				columns={payslipColumns}
				rows={payslips}
				rowKey={(row) => row.id}
				loading={loadingPayslips}
				total={payslipsTotal}
				page={payslipsPage}
				pageSize={12}
				searchable={false}
				emptyTitle="No payslips yet"
				onPageChange={(p) => {
					payslipsPage = p;
					void loadPayslips();
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
{:else}
	<div class="card border-0 shadow-sm mb-3">
		<div class="card-body d-flex flex-wrap align-items-end gap-2">
			<div>
				<label for="runMonth" class="form-label small fw-semibold">Month</label>
				<input
					id="runMonth"
					type="number"
					min="1"
					max="12"
					class="form-control"
					style="width: 90px;"
					bind:value={runMonth}
				/>
			</div>
			<div>
				<label for="runYear" class="form-label small fw-semibold">Year</label>
				<input
					id="runYear"
					type="number"
					class="form-control"
					style="width: 110px;"
					bind:value={runYear}
				/>
			</div>
			<button
				type="button"
				class="btn btn-primary"
				disabled={generating}
				onclick={handleGenerateRun}
			>
				{#if generating}
					<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"
					></span>
				{/if}
				Generate payroll run
			</button>
		</div>
	</div>

	<div class="card border-0 shadow-sm">
		<div class="card-body">
			<DataTable
				columns={runColumns}
				rows={runs}
				rowKey={(row) => row.id}
				loading={loadingRuns}
				total={runsTotal}
				page={runsPage}
				pageSize={12}
				searchable={false}
				emptyTitle="No payroll runs yet"
				onPageChange={(p) => {
					runsPage = p;
					void loadRuns();
				}}
			>
				{#snippet rowActions(row)}
					{#if row.status === 'DRAFT'}
						<button
							type="button"
							class="btn btn-sm btn-success"
							onclick={() => handleApproveRun(row.id)}>Approve</button
						>
					{/if}
				{/snippet}
			</DataTable>
		</div>
	</div>
{/if}
