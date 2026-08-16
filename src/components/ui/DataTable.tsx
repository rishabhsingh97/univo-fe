import { useEffect, useState, type ReactNode } from 'react';
import './ui.css';
import { Spinner } from './Spinner';
import { Button } from './Button';
import { useLocale } from '../../context/LocaleContext';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /**
   * The backend-sortable property name for this column (e.g. "firstName", or a nested path
   * like "orgUnit.name"), sent as-is in the `sort` query param. Omit for columns that aren't a
   * real, directly-sortable entity property (computed/joined display text, action buttons).
   */
  sortKey?: string;
}

export interface DataTableSort {
  key: string;
  direction: 'asc' | 'desc';
}

export interface DataTablePagination {
  /** 0-based, matches Spring Data's Page<T>. */
  page: number;
  /** The requested page size (PageResponse.size) - used with `page` to compute the "X-Y of Z"
   * summary, since the last page's row count alone isn't enough to derive it. */
  size: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  /** Sorting is server-side (same request as the page itself) - omit both to render plain,
   * unsorted column headers. */
  sort?: DataTableSort | null;
  onSortChange?: (key: string) => void;
}

/**
 * One generic table every list page uses instead of hand-rolling <table> markup per page -
 * that's the "centralized and reusable" component for tabular data across the app.
 *
 * The body scrolls independently once it exceeds `maxHeight` (header stays pinned via
 * `position: sticky`) instead of pushing the rest of the page down - important once a table
 * has enough rows to matter. Pass `pagination` (built from a PageResponse) for pages backed by
 * a paged API; omitting it renders a plain, unpaginated table as before.
 */
export function DataTable<T>({
  columns,
  rows,
  isLoading,
  emptyMessage,
  getRowKey,
  maxHeight = '60vh',
  pagination,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  getRowKey: (row: T) => string | number;
  maxHeight?: string;
  pagination?: DataTablePagination;
}) {
  const { t } = useLocale();
  const resolvedEmptyMessage = emptyMessage ?? t('table.empty');
  return (
    <div className="table-shell">
      <div className="table-wrapper" style={{ maxHeight }}>
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => {
                const sortable = Boolean(col.sortKey && pagination?.onSortChange);
                const active = sortable && pagination?.sort?.key === col.sortKey;
                if (!sortable) {
                  return <th key={col.key}>{col.header}</th>;
                }
                return (
                  <th key={col.key}>
                    <button
                      type="button"
                      className={`table-sort-button${active ? ' active' : ''}`}
                      onClick={() => pagination?.onSortChange?.(col.sortKey as string)}
                    >
                      {col.header}
                      <span className="table-sort-arrow" aria-hidden="true">
                        {active ? (pagination?.sort?.direction === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px' }}>
                  <Spinner />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                  {resolvedEmptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={getRowKey(row)}>
                  {columns.map((col) => (
                    <td key={col.key}>{col.render(row)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && pagination.totalElements > 0 && pagination.totalPages > 1 && (
        <div className="table-pagination">
          <span className="table-pagination-summary">
            {t('table.pageSummary')
              .replace('{from}', String(pagination.page * pagination.size + 1))
              .replace('{to}', String(Math.min(pagination.page * pagination.size + rows.length, pagination.totalElements)))
              .replace('{total}', String(pagination.totalElements))}
          </span>
          <div className="table-pagination-controls">
            <Button
              type="button"
              variant="secondary"
              disabled={pagination.page <= 0}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              {t('table.previous')}
            </Button>
            <PageJumpInput
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={pagination.onPageChange}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={pagination.page >= pagination.totalPages - 1}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              {t('table.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * "Page [_] of N" where the box is a real input - typing a number and pressing Enter (or
 * blurring) jumps straight there, instead of only ever being able to step one page at a time.
 * Keeps its own draft text (not just the committed page) so a partial/invalid edit-in-progress
 * doesn't get clobbered by the `page` prop on every keystroke.
 */
function PageJumpInput({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useLocale();
  const [draft, setDraft] = useState(String(page + 1));

  useEffect(() => {
    setDraft(String(page + 1));
  }, [page]);

  const commit = () => {
    const parsed = Number.parseInt(draft, 10);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed - 1);
    } else {
      setDraft(String(page + 1));
    }
  };

  return (
    <span className="table-pagination-page">
      {t('table.page')}
      <input
        type="number"
        className="table-pagination-input"
        min={1}
        max={totalPages}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
        }}
      />
      {t('table.of').replace('{totalPages}', String(totalPages))}
    </span>
  );
}
