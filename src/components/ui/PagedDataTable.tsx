import { useQuery } from '@tanstack/react-query';
import { DataTable, type DataTableColumn } from './DataTable';
import type { ActionMenuItem } from './ActionMenu';
import { usePagedTable } from '../../hooks/usePagedTable';
import type { PageResponse } from '../../types/common';

export interface PagedDataTableProps<T> {
  columns: DataTableColumn<T>[];
  /** Base TanStack Query key (e.g. ['employees']) - page/sort are appended internally. Page
   * mutations should invalidate this same base key; TanStack's prefix matching refetches
   * whatever page/sort is currently showing without the page needing to know either. */
  queryKey: unknown[];
  fetchPage: (page: number, size: number, sort?: string, filters?: Record<string, string>) => Promise<PageResponse<T>>;
  getRowKey: (row: T) => string | number;
  pageSize?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  maxHeight?: string;
  /** See DataTable - passing any of these appends a row-actions column automatically. */
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  extraActions?: (row: T) => ActionMenuItem[];
  /** See DataTable - opts this table into the persisted column show/hide picker. Omit this on
   * every PagedDataTable call site (including new ones) - it's derived from `queryKey` below,
   * so the picker just works everywhere with zero per-page wiring. Pass it explicitly only if
   * two different tables would otherwise collide on the same derived key (they won't: queryKey
   * is already required to be unique per table for TanStack Query's own cache to work). */
  viewKey?: string;
}

/**
 * The paginated/sortable list case (the vast majority of list pages) in one place, instead of
 * every page owning its own page/sort state + useQuery + pagination-prop wiring for what is
 * always the same shape of request. Pages that need something DataTable's plain `rows` prop
 * doesn't fit (merged/synthetic rows, client-only data) still use <DataTable> directly - those
 * need an explicit `viewKey` passed straight to <DataTable> if they also want the column picker,
 * since there's no queryKey here to derive one from.
 */
export function PagedDataTable<T>({
  columns,
  queryKey,
  fetchPage,
  getRowKey,
  pageSize = 10,
  emptyMessage,
  maxHeight,
  onView,
  onEdit,
  onDelete,
  extraActions,
  viewKey,
}: PagedDataTableProps<T>) {
  const table = usePagedTable(pageSize);

  const { data, isLoading } = useQuery({
    queryKey: [...queryKey, table.page, table.size, table.sortParam, table.filters],
    queryFn: () => fetchPage(table.page, table.size, table.sortParam, table.filters),
  });

  // Every table's `queryKey` is already a stable, unique-per-table identifier (that's what
  // makes TanStack Query's own cache work) - reusing it here means the column show/hide picker
  // (and the row-selection/export it brings along) is on by default for every list page built
  // on PagedDataTable, with no per-page opt-in.
  const resolvedViewKey = viewKey ?? queryKey.map(String).join('.');

  // Export's "All pages" scope - one extra request for every row matching the current
  // filters/sort (not just this page), reusing the same `fetchPage` the table already calls
  // rather than a dedicated export endpoint. Only meaningful once the total count is known.
  const fetchAllRows = data
    ? () => fetchPage(0, Math.max(data.totalElements, 1), table.sortParam, table.filters).then((page) => page.content)
    : undefined;

  return (
    <DataTable
      columns={columns}
      rows={data?.content ?? []}
      isLoading={isLoading}
      getRowKey={getRowKey}
      emptyMessage={emptyMessage}
      maxHeight={maxHeight}
      pagination={table.paginationFor(data)}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      extraActions={extraActions}
      viewKey={resolvedViewKey}
      fetchAllRows={fetchAllRows}
      exportFileName={resolvedViewKey}
    />
  );
}
