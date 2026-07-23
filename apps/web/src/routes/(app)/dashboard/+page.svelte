<script lang="ts">
	import { onMount } from 'svelte';
	import ApexChart from '../../../lib/components/ui/ApexChart.svelte';
	import EmptyState from '../../../lib/components/ui/EmptyState.svelte';
	import StatCard from '../../../lib/components/ui/StatCard.svelte';
	import { loadDashboardData } from '../../../lib/features/dashboard/api.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { currentUser } from '../../../lib/stores/auth.js';
	import { toasts } from '../../../lib/stores/toast.js';

	type DashboardData = Awaited<ReturnType<typeof loadDashboardData>>;

	let loading = $state(true);
	let data = $state<DashboardData | null>(null);

	onMount(async () => {
		try {
			data = await loadDashboardData();
		} catch (err) {
			toasts.error('Could not load dashboard data', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	});

	const greetingName = $derived($currentUser?.employee?.firstName ?? $currentUser?.email ?? '');

	const totalLeaveAvailable = $derived(
		data ? data.leaveBalances.reduce((sum, b) => sum + Number(b.available), 0) : 0
	);

	const attendanceCounts = $derived.by(() => {
		const counts = { PRESENT: 0, LATE: 0, ABSENT: 0, ON_LEAVE: 0, OTHER: 0 };
		if (!data) return counts;
		for (const record of data.attendance) {
			if (record.status === 'PRESENT' || record.status === 'WORK_FROM_HOME') counts.PRESENT++;
			else if (record.status === 'LATE') counts.LATE++;
			else if (record.status === 'ABSENT') counts.ABSENT++;
			else if (record.status === 'ON_LEAVE') counts.ON_LEAVE++;
			else counts.OTHER++;
		}
		return counts;
	});

	const attendanceChartOptions = $derived({
		chart: { type: 'donut' as const, toolbar: { show: false } },
		labels: ['On time', 'Late', 'Absent', 'On leave', 'Other'],
		colors: ['#1f9d63', '#d68b00', '#d6415a', '#2196c9', '#8892a0'],
		series: [
			attendanceCounts.PRESENT,
			attendanceCounts.LATE,
			attendanceCounts.ABSENT,
			attendanceCounts.ON_LEAVE,
			attendanceCounts.OTHER
		],
		legend: { position: 'bottom' as const },
		dataLabels: { enabled: false }
	});
</script>

<svelte:head>
	<title>Dashboard — Atyantik EMS</title>
</svelte:head>

<div class="d-flex flex-column gap-4">
	<div>
		<h1 class="h4 fw-bold mb-1">Welcome back{greetingName ? `, ${greetingName}` : ''}</h1>
		<p class="text-muted-2 mb-0">Here's what's happening across Atyantik today.</p>
	</div>

	<div class="row g-3">
		<div class="col-6 col-lg-3">
			<StatCard
				label="Leave days available"
				value={totalLeaveAvailable}
				icon="bi-airplane"
				variant="primary"
				{loading}
			/>
		</div>
		<div class="col-6 col-lg-3">
			<StatCard
				label="Present days this month"
				value={attendanceCounts.PRESENT}
				icon="bi-calendar-check"
				variant="success"
				{loading}
			/>
		</div>
		<div class="col-6 col-lg-3">
			<StatCard
				label="Late days"
				value={attendanceCounts.LATE}
				icon="bi-alarm"
				variant="warning"
				{loading}
			/>
		</div>
		<div class="col-6 col-lg-3">
			<StatCard
				label="Announcements"
				value={data?.announcements.total ?? 0}
				icon="bi-megaphone"
				variant="info"
				{loading}
			/>
		</div>
	</div>

	<div class="row g-3">
		<div class="col-lg-5">
			<div class="card border-0 shadow-sm h-100">
				<div class="card-body">
					<h2 class="h6 fw-bold mb-3">This month's attendance</h2>
					{#if loading}
						<div class="skeleton" style="height: 220px;"></div>
					{:else if data && data.attendance.length > 0}
						<ApexChart options={attendanceChartOptions} height={240} />
					{:else}
						<EmptyState icon="bi-calendar-x" title="No attendance recorded yet this month" />
					{/if}
				</div>
			</div>
		</div>

		<div class="col-lg-7">
			<div class="card border-0 shadow-sm h-100">
				<div class="card-body">
					<div class="d-flex justify-content-between align-items-center mb-3">
						<h2 class="h6 fw-bold mb-0">Announcements</h2>
						<a href="/announcements" class="small">View all</a>
					</div>
					{#if loading}
						{#each [0, 1, 2] as _skeleton, i (i)}
							<div class="skeleton mb-2" style="height: 3rem;"></div>
						{/each}
					{:else if data && data.announcements.items.length > 0}
						<ul class="list-unstyled d-flex flex-column gap-3 mb-0">
							{#each data.announcements.items as announcement (announcement.id)}
								<li class="d-flex gap-2">
									{#if announcement.isPinned}
										<i class="bi bi-pin-angle-fill text-primary mt-1"></i>
									{:else}
										<i class="bi bi-megaphone text-muted-2 mt-1"></i>
									{/if}
									<div>
										<div class="fw-semibold small">{announcement.title}</div>
										<div class="text-muted-2 small">
											{new Date(announcement.publishAt).toLocaleDateString()}
										</div>
									</div>
								</li>
							{/each}
						</ul>
					{:else}
						<EmptyState icon="bi-megaphone" title="No announcements yet" />
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
