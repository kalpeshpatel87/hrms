<script lang="ts">
	interface Props {
		status: string;
		map?: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'>;
	}

	const DEFAULT_MAP: Record<
		string,
		'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'
	> = {
		ACTIVE: 'success',
		APPROVED: 'success',
		PRESENT: 'success',
		COMPLETED: 'success',
		PAID: 'success',
		PROBATION: 'info',
		PENDING: 'warning',
		LATE: 'warning',
		SUBMITTED: 'warning',
		DRAFT: 'secondary',
		ON_LEAVE: 'info',
		NOTICE_PERIOD: 'warning',
		SUSPENDED: 'danger',
		RESIGNED: 'secondary',
		TERMINATED: 'danger',
		ABSCONDED: 'danger',
		REJECTED: 'danger',
		CANCELLED: 'secondary',
		ABSENT: 'danger'
	};

	let { status, map = DEFAULT_MAP }: Props = $props();
	const variant = $derived(map[status] ?? 'secondary');
	const label = $derived(status.replaceAll('_', ' '));
</script>

<span class="badge text-bg-{variant} fw-normal text-capitalize">{label.toLowerCase()}</span>
