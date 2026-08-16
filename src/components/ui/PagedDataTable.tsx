import { useQuery } from '@tanstack/react-query';
import { DataTable, type DataTableColumn } from './DataTable';
import { usePagedTable } from '../../hooks/usePagedTable';
import type { PageResponse } from '../../types/common';

export interface PagedDataTableProps<T> {
  columns: DataTableColumn<T>[];
  /** Base TanStack Query key (e.g. ['employees']) - page/sort are appended internally. Page
   * mutations should invalidate this same base key; TanStack's prefix matching refetches
   * whatever page/sort is currently showing without the page needing to know either. */
  queryKey: unknown[];
  fetchPage: (page: number, size: number, sort?: string) => Promise<PageResponse<T>>;
  getRowKey: (row: T) => string | number;
  pageSize?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  maxHeight?: string;
}

/**
 * The paginated/sortable list case (the vast majority of list pages) in one place, instead of
 * every page owning its own page/sort state + useQuery + pagination-prop wiring for what is
 * always the same shape of request. Pages that need something DataTable's plain `rows` prop
 * doesn't fit (merged/synthetic rows, client-only data) still use <DataTable> directly.
 */
export function PagedDataTable<T>({
  columns,
  queryKey,
  fetchPage,
  getRowKey,
  pageSize = 20,
  emptyMessage,
  maxHeight,
}: PagedDataTableProps<T>) {
  const table = usePagedTable(pageSize);

  const { data, isLoading } = useQuery({
    queryKey: [...queryKey, table.page, table.sortParam],
    queryFn: () => fetchPage(table.page, table.size, table.sortParam),
  });

  return (
    <DataTable
      columns={columns}
      rows={data?.content ?? []}
      isLoading={isLoading}
      getRowKey={getRowKey}
      emptyMessage={emptyMessage}
      maxHeight={maxHeight}
      pagination={table.paginationFor(data)}
    />
  );
}
