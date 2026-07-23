<script lang="ts">
	import { onMount } from 'svelte';
	import EmptyState from '../../../lib/components/ui/EmptyState.svelte';
	import {
		enrollInCourse,
		listCourses,
		listMyEnrollments
	} from '../../../lib/features/learning/api.js';
	import type { Course, Enrollment } from '../../../lib/features/learning/types.js';
	import { extractErrorMessage } from '../../../lib/services/api-client.js';
	import { toasts } from '../../../lib/stores/toast.js';

	let activeTab = $state<'catalog' | 'mine'>('catalog');
	let courses = $state<Course[]>([]);
	let enrollments = $state<Enrollment[]>([]);
	let loading = $state(true);
	let enrollingId = $state<string | null>(null);

	function isEnrolled(courseId: string): boolean {
		return enrollments.some((e) => e.course.id === courseId);
	}

	async function load() {
		loading = true;
		try {
			const [courseResult, enrollmentResult] = await Promise.all([
				listCourses({ page: 1, pageSize: 50 }),
				listMyEnrollments({ page: 1, pageSize: 50 })
			]);
			courses = courseResult.items;
			enrollments = enrollmentResult.items;
		} catch (err) {
			toasts.error('Could not load learning data', extractErrorMessage(err));
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function handleEnroll(course: Course) {
		enrollingId = course.id;
		try {
			await enrollInCourse(course.id);
			toasts.success(`Enrolled in ${course.title}`);
			await load();
		} catch (err) {
			toasts.error('Could not enroll', extractErrorMessage(err));
		} finally {
			enrollingId = null;
		}
	}
</script>

<svelte:head>
	<title>Learning — Atyantik EMS</title>
</svelte:head>

<div class="mb-3">
	<h1 class="h4 fw-bold mb-1">Learning</h1>
	<p class="text-muted-2 mb-0">Courses, training, and your progress.</p>
</div>

<ul class="nav nav-tabs mb-3">
	<li class="nav-item">
		<button
			type="button"
			class="nav-link"
			class:active={activeTab === 'catalog'}
			onclick={() => (activeTab = 'catalog')}
		>
			Course Catalog
		</button>
	</li>
	<li class="nav-item">
		<button
			type="button"
			class="nav-link"
			class:active={activeTab === 'mine'}
			onclick={() => (activeTab = 'mine')}
		>
			My Enrollments
		</button>
	</li>
</ul>

{#if loading}
	<div class="skeleton" style="height: 200px;"></div>
{:else if activeTab === 'catalog'}
	{#if courses.length === 0}
		<EmptyState icon="bi-mortarboard" title="No courses available yet" />
	{:else}
		<div class="row g-3">
			{#each courses as course (course.id)}
				<div class="col-md-6 col-lg-4">
					<div class="card border-0 shadow-sm h-100">
						<div class="card-body d-flex flex-column">
							<div class="d-flex justify-content-between align-items-start mb-1">
								<h2 class="h6 fw-bold mb-0">{course.title}</h2>
								{#if course.isMandatory}
									<span class="badge text-bg-warning">Mandatory</span>
								{/if}
							</div>
							<p class="text-muted-2 small flex-grow-1">
								{course.description ?? 'No description provided.'}
							</p>
							<div class="d-flex justify-content-between align-items-center">
								<span class="text-muted-2 small">
									{course.durationMinutes ? `${course.durationMinutes} min` : ''}
									{course.provider ? ` · ${course.provider}` : ''}
								</span>
								{#if isEnrolled(course.id)}
									<span class="badge text-bg-success">Enrolled</span>
								{:else}
									<button
										type="button"
										class="btn btn-sm btn-primary"
										disabled={enrollingId === course.id}
										onclick={() => handleEnroll(course)}
									>
										Enroll
									</button>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
{:else if enrollments.length === 0}
	<EmptyState icon="bi-journal-check" title="You haven't enrolled in any courses yet" />
{:else}
	<div class="d-flex flex-column gap-2">
		{#each enrollments as enrollment (enrollment.id)}
			<div class="card border-0 shadow-sm">
				<div class="card-body d-flex justify-content-between align-items-center">
					<div>
						<div class="fw-semibold">{enrollment.course.title}</div>
						<div class="text-muted-2 small">
							Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
						</div>
					</div>
					<span class="badge text-bg-light border"
						>{enrollment.status.replaceAll('_', ' ').toLowerCase()}</span
					>
				</div>
			</div>
		{/each}
	</div>
{/if}
