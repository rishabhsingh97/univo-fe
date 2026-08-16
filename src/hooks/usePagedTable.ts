import { useState } from 'react';
import type { DataTablePagination, DataTableSort } from '../components/ui/DataTable';
import type { PageResponse } from '../types/common';

/**
 * Page + sort state for a DataTable backed by a real paginated/sortable backend endpoint
 * (Spring Data's Page<T> + Pageable `sort` param) - one implementation of "click a column
 * header, request re-sorts, page resets to 0" instead of every list page reinventing it.
 *
 * Usage: `const table = usePagedTable(20)`, pass `table.page/table.size/table.sortParam` into
 * the list query, then `pagination={table.paginationFor(data)}` straight onto <DataTable>.
 */
export function usePagedTable(initialSize = 20) {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(initialSize);
  const [sort, setSort] = useState<DataTableSort | null>(null);

  const sortParam = sort ? `${sort.key},${sort.direction}` : undefined;

  const onSortChange = (key: string) => {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: 'asc' };
      if (current.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
    setPage(0);
  };

  const onSizeChange = (newSize: number) => {
    setSize(newSize);
    setPage(0);
  };

  const paginationFor = <T,>(data: PageResponse<T> | undefined): DataTablePagination => ({
    page,
    size,
    totalPages: data?.totalPages ?? 0,
    totalElements: data?.totalElements ?? 0,
    onPageChange: setPage,
    onSizeChange,
    sort,
    onSortChange,
  });

  return { page, size, sort, sortParam, onPageChange: setPage, onSizeChange, onSortChange, paginationFor };
}
