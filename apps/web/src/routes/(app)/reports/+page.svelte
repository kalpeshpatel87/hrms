<script lang="ts">
	import { onMount } from 'svelte';
	import ApexChart from '../../../lib/components/ui/ApexChart.svelte';
	import EmptyState from '../../../lib/components/ui/EmptyState.svelte';
	import {
		getAttendanceSummary,
		getHeadcountByDepartment,
		getLeaveSummary,
		getPayrollSummary
	} from '../../../lib/features/report/api.js';
	import type {
		AttendanceSummaryRow,
		HeadcountByDepartment,
		LeaveSummaryRow,
		PayrollSummaryRow
	} from '../../../lib/features/report/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { toasts } from '../../../lib/stores/toast.js';

	const now = new Date();
	let month = $state(now.getMonth() + 1);
	let year = $state(now.getFullYear());

	let loading = $state(true);
	let headcount = $state<HeadcountByDepartment[]>([]);
	let attendance = $state<AttendanceSummaryRow[]>([]);
	let leave = $state<LeaveSummaryRow[]>([]);
	let payroll = $state<PayrollSummaryRow[]>([]);

	const monthNames = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	];

	async function load() {
		loading = true;
		try {
			[headcount, attendance, leave, payroll] = await Promise.all([
				getHeadcountByDepartment(),
				getAttendanceSummary(month, year),
				getLeaveSummary(year),
				getPayrollSummary(year)
			]);
		} catch (err) {
			toasts.error('Could not load reports', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	const headcountChartOptions = $derived({
		chart: { type: 'bar' as const, toolbar: { show: false } },
		plotOptions: { bar: { borderRadius: 4, horizontal: true } },
		xaxis: { categories: headcount.map((h) => h.departmentName) },
		series: [{ name: 'Employees', data: headcount.map((h) => h.count) }],
		dataLabels: { enabled: false },
		colors: ['#2196c9']
	});

	const attendanceChartOptions = $derived({
		chart: { type: 'donut' as const, toolbar: { show: false } },
		labels: attendance.map((a) => a.status),
		series: attendance.map((a) => a.count),
		legend: { position: 'bottom' as const },
		dataLabels: { enabled: false }
	});

	const leaveChartOptions = $derived({
		chart: { type: 'bar' as const, toolbar: { show: false } },
		plotOptions: { bar: { borderRadius: 4 } },
		xaxis: { categories: leave.map((l) => l.leaveTypeName) },
		series: [{ name: 'Days taken', data: leave.map((l) => Number(l.totalDays)) }],
		dataLabels: { enabled: false },
		colors: ['#8892a0']
	});

	const payrollChartOptions = $derived({
		chart: { type: 'line' as const, toolbar: { show: false } },
		xaxis: { categories: payroll.map((p) => monthNames[p.month - 1]) },
		series: [{ name: 'Net pay', data: payroll.map((p) => Number(p.netPay)) }],
		dataLabels: { enabled: false },
		colors: ['#1f9d63']
	});
</script>

<svelte:head>
	<title>Reports — Atyantik EMS</title>
</svelte:head>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
	<div>
		<h1 class="h4 fw-bold mb-1">Reports</h1>
		<p class="text-muted-2 mb-0">Company-wide headcount, attendance, leave and payroll summaries.</p>
	</div>
	<div class="d-flex gap-2">
		<select
			class="form-select form-select-sm"
			style="width: auto;"
			bind:value={month}
			onchange={load}
		>
			{#each monthNames as name, i (name)}
				<option value={i + 1}>{name}</option>
			{/each}
		</select>
		<select
			class="form-select form-select-sm"
			style="width: auto;"
			bind:value={year}
			onchange={load}
		>
			{#each [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2] as y (y)}
				<option value={y}>{y}</option>
			{/each}
		</select>
	</div>
</div>

<div class="row g-3">
	<div class="col-lg-6">
		<div class="card border-0 shadow-sm h-100">
			<div class="card-body">
				<h2 class="h6 fw-bold mb-3">Headcount by department</h2>
				{#if loading}
					<div class="skeleton" style="height: 220px;"></div>
				{:else if headcount.length > 0}
					<ApexChart options={headcountChartOptions} height={260} />
				{:else}
					<EmptyState icon="bi-people" title="No employees found" />
				{/if}
			</div>
		</div>
	</div>

	<div class="col-lg-6">
		<div class="card border-0 shadow-sm h-100">
			<div class="card-body">
				<h2 class="h6 fw-bold mb-3">Attendance — {monthNames[month - 1]} {year}</h2>
				{#if loading}
					<div class="skeleton" style="height: 220px;"></div>
				{:else if attendance.length > 0}
					<ApexChart options={attendanceChartOptions} height={260} />
				{:else}
					<EmptyState icon="bi-calendar-x" title="No attendance recorded for this period" />
				{/if}
			</div>
		</div>
	</div>

	<div class="col-lg-6">
		<div class="card border-0 shadow-sm h-100">
			<div class="card-body">
				<h2 class="h6 fw-bold mb-3">Leave taken by type — {year}</h2>
				{#if loading}
					<div class="skeleton" style="height: 220px;"></div>
				{:else if leave.length > 0}
					<ApexChart options={leaveChartOptions} height={260} />
				{:else}
					<EmptyState icon="bi-airplane" title="No approved leave for this year" />
				{/if}
			</div>
		</div>
	</div>

	<div class="col-lg-6">
		<div class="card border-0 shadow-sm h-100">
			<div class="card-body">
				<h2 class="h6 fw-bold mb-3">Net payroll cost — {year}</h2>
				{#if loading}
					<div class="skeleton" style="height: 220px;"></div>
				{:else if payroll.length > 0}
					<ApexChart options={payrollChartOptions} height={260} />
				{:else}
					<EmptyState icon="bi-cash-coin" title="No payslips generated for this year" />
				{/if}
			</div>
		</div>
	</div>
</div>
