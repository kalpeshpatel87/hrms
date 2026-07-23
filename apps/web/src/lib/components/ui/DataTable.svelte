<script module lang="ts">
	export interface Column {
		key: string;
		label: string;
		sortable?: boolean;
		align?: 'start' | 'center' | 'end';
		width?: string;
	}
</script>

<script lang="ts" generics="T extends object">
	import type { Snippet } from 'svelte';
	import EmptyState from './EmptyState.svelte';

	interface Props {
		columns: Column[];
		rows: T[];
		rowKey: (row: T) => string;
		loading?: boolean;
		total?: number;
		page?: number;
		pageSize?: number;
		sortBy?: string;
		sortDir?: 'asc' | 'desc';
		searchable?: boolean;
		searchPlaceholder?: string;
		emptyTitle?: string;
		emptyMessage?: string;
		onPageChange?: (page: number) => void;
		onSortChange?: (sortBy: string, sortDir: 'asc' | 'desc') => void;
		onSearchChange?: (search: string) => void;
		rowActions?: Snippet<[T]>;
	}

	let {
		columns,
		rows,
		rowKey,
		loading = false,
		total = rows.length,
		page = 1,
		pageSize = 20,
		sortBy,
		sortDir = 'asc',
		searchable = true,
		searchPlaceholder = 'Search…',
		emptyTitle = 'No records found',
		emptyMessage,
		onPageChange,
		onSortChange,
		onSearchChange,
		rowActions
	}: Props = $props();

	let searchValue = $state('');
	let searchDebounce: ReturnType<typeof setTimeout>;

	function handleSearchInput() {
		clearTimeout(searchDebounce);
		searchDebounce = setTimeout(() => onSearchChange?.(searchValue), 350);
	}

	function toggleSort(column: Column) {
		if (!column.sortable || !onSortChange) return;
		if (sortBy === column.key) {
			onSortChange(column.key, sortDir === 'asc' ? 'desc' : 'asc');
		} else {
			onSortChange(column.key, 'asc');
		}
	}

	const totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));
	const rangeStart = $derived(total === 0 ? 0 : (page - 1) * pageSize + 1);
	const rangeEnd = $derived(Math.min(total, page * pageSize));

	function cellValue(row: T, key: string): unknown {
		return key.split('.').reduce<unknown>((acc, part) => {
			if (acc && typeof acc === 'object' && part in acc) {
				return (acc as Record<string, unknown>)[part];
			}
			return undefined;
		}, row);
	}
</script>

<div class="data-table-wrapper">
	{#if searchable}
		<div class="mb-3 d-flex justify-content-between align-items-center gap-2 flex-wrap">
			<div class="input-group" style="max-width: 320px;">
				<span class="input-group-text bg-transparent border-end-0"
					><i class="bi bi-search"></i></span
				>
				<input
					type="search"
					class="form-control border-start-0"
					placeholder={searchPlaceholder}
					bind:value={searchValue}
					oninput={handleSearchInput}
				/>
			</div>
		</div>
	{/if}

	<div class="table-responsive">
		<table class="table align-middle">
			<thead>
				<tr>
					{#each columns as column (column.key)}
						<th
							scope="col"
							class="text-{column.align ?? 'start'}"
							style={column.width ? `width: ${column.width}` : undefined}
						>
							{#if column.sortable}
								<button
									type="button"
									class="btn btn-sm btn-link p-0 text-decoration-none fw-semibold text-body"
									onclick={() => toggleSort(column)}
								>
									{column.label}
									{#if sortBy === column.key}
										<i class="bi {sortDir === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down'} small"></i>
									{/if}
								</button>
							{:else}
								{column.label}
							{/if}
						</th>
					{/each}
					{#if rowActions}
						<th scope="col" class="text-end">Actions</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#if loading}
					{#each [0, 1, 2, 3, 4] as skeletonRow (skeletonRow)}
						<tr>
							{#each columns as column (column.key)}
								<td><div class="skeleton" style="height: 1.1rem;"></div></td>
							{/each}
							{#if rowActions}
								<td></td>
							{/if}
						</tr>
					{/each}
				{:else if rows.length === 0}
					<tr>
						<td colspan={columns.length + (rowActions ? 1 : 0)}>
							<EmptyState title={emptyTitle} message={emptyMessage} />
						</td>
					</tr>
				{:else}
					{#each rows as row (rowKey(row))}
						<tr>
							{#each columns as column (column.key)}
								<td class="text-{column.align ?? 'start'}">
									{cellValue(row, column.key) ?? '—'}
								</td>
							{/each}
							{#if rowActions}
								<td class="text-end">
									{@render rowActions(row)}
								</td>
							{/if}
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	{#if !loading && total > 0}
		<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-2">
			<span class="text-muted-2 small">
				Showing {rangeStart}–{rangeEnd} of {total}
			</span>
			<nav aria-label="Pagination">
				<ul class="pagination pagination-sm mb-0">
					<li class="page-item" class:disabled={page <= 1}>
						<button type="button" class="page-link" onclick={() => onPageChange?.(page - 1)}
							>Previous</button
						>
					</li>
					<li class="page-item disabled">
						<span class="page-link">{page} / {totalPages}</span>
					</li>
					<li class="page-item" class:disabled={page >= totalPages}>
						<button type="button" class="page-link" onclick={() => onPageChange?.(page + 1)}
							>Next</button
						>
					</li>
				</ul>
			</nav>
		</div>
	{/if}
</div>
