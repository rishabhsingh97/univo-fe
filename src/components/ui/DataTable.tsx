import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './ui.css';
import { Spinner } from './Spinner';
import { Button } from './Button';
import { ActionMenu, deleteAction, editAction, viewAction, type ActionMenuItem } from './ActionMenu';
import { useLocale } from '../../context/LocaleContext';

export type DataTableColumnFilter =
  | { type: 'text'; paramKey?: string; placeholder?: string }
  | { type: 'select'; paramKey?: string; options: string[]; placeholder?: string };

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
  /**
   * Server-side column filter, exposed as a small filter icon next to the column header that
   * opens a popover - same shape as sorting (one request param per column, sent alongside
   * page/size/sort). `paramKey` is the backend query param name and defaults to `key` when
   * omitted (they differ when, e.g., the "designation" column filters on `designationTitle`).
   * `select` options must come from wherever the page sources them (a live backend
   * enum/master-data list) - never a value hardcoded here.
   */
  filter?: DataTableColumnFilter;
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
  /** Omit to hide the page-size selector entirely (a page not wired up for it). */
  onSizeChange?: (size: number) => void;
  /** Filtering is server-side (same request as the page itself), keyed by each column filter's
   * `paramKey` - omit both to render columns with no filter icon at all, regardless of whether
   * individual columns declare a `filter`. */
  filters?: Record<string, string>;
  onFilterChange?: (paramKey: string, value: string) => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * One generic table every list page uses instead of hand-rolling <table> markup per page -
 * that's the "centralized and reusable" component for tabular data across the app.
 *
 * The body scrolls independently once it exceeds `maxHeight` (header stays pinned via
 * `position: sticky`) instead of pushing the rest of the page down - important once a table
 * has enough rows to matter. Pass `pagination` (built from a PageResponse) for pages backed by
 * a paged API; omitting it renders a plain, unpaginated table as before.
 *
 * Row actions (View/Edit/Delete plus anything page-specific) are built in here from
 * onView/onEdit/onDelete/extraActions instead of the page defining its own "actions" column -
 * that column is appended automatically whenever at least one of those is passed, so a plain
 * CRUD page never needs to import ActionMenu/editAction/etc itself.
 */
export function DataTable<T>({
  columns,
  rows,
  isLoading,
  emptyMessage,
  getRowKey,
  maxHeight = '60vh',
  pagination,
  onView,
  onEdit,
  onDelete,
  extraActions,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  getRowKey: (row: T) => string | number;
  maxHeight?: string;
  pagination?: DataTablePagination;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  /** Wrapped in a window.confirm(t('common.confirmDelete')) automatically. */
  onDelete?: (row: T) => void;
  /** Anything beyond View/Edit/Delete - approve/reject, generate credentials, ... - collapses
   * into the row's "⋮" dropdown alongside whichever of those three are present. */
  extraActions?: (row: T) => ActionMenuItem[];
}) {
  const { t } = useLocale();
  const resolvedEmptyMessage = emptyMessage ?? t('table.empty');

  const filtersEnabled = Boolean(pagination?.onFilterChange);
  const hasRowActions = Boolean(onView || onEdit || onDelete || extraActions);
  const allColumns: DataTableColumn<T>[] = hasRowActions
    ? [
        ...columns,
        {
          key: 'actions',
          header: t('common.actions'),
          render: (row: T) => {
            const items: ActionMenuItem[] = [];
            if (onView) items.push(viewAction(t('common.view'), () => onView(row)));
            if (onEdit) items.push(editAction(t('common.edit'), () => onEdit(row)));
            if (onDelete) {
              items.push(
                deleteAction(t('common.delete'), () => window.confirm(t('common.confirmDelete')) && onDelete(row)),
              );
            }
            if (extraActions) items.push(...extraActions(row));
            return <ActionMenu items={items} />;
          },
        },
      ]
    : columns;

  return (
    <div className="table-shell">
      <div className="table-wrapper" style={{ maxHeight }}>
        <table className="table">
          <thead>
            <tr>
              {allColumns.map((col) => {
                const sortable = Boolean(col.sortKey && pagination?.onSortChange);
                const active = sortable && pagination?.sort?.key === col.sortKey;
                const stickyClass = col.key === 'actions' ? 'table-cell-sticky-right' : undefined;
                const filter = filtersEnabled ? col.filter : undefined;
                const paramKey = filter ? (filter.paramKey ?? col.key) : undefined;
                const filterValue = paramKey ? (pagination?.filters?.[paramKey] ?? '') : '';

                const headerText = sortable ? (
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
                ) : (
                  col.header
                );

                return (
                  <th key={col.key} className={stickyClass}>
                    <span className="table-header-cell">
                      {headerText}
                      {filter && paramKey && (
                        <ColumnFilterButton
                          filter={filter}
                          value={filterValue}
                          onChange={(next) => pagination?.onFilterChange?.(paramKey, next)}
                        />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={allColumns.length} style={{ height: 240 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Spinner />
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                {/* height (not just padding) so this row fills .table-wrapper's own min-height
                    instead of leaving bare, un-hoverable wrapper space below a short row - that
                    gap used to read as "half the table" not highlighting on hover. */}
                <td colSpan={allColumns.length} style={{ height: 200, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  {resolvedEmptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className={onView ? 'table-row-clickable' : undefined}
                  onClick={
                    onView
                      ? (e) => {
                          // Row-level click is a convenience for "view" - actual buttons/links
                          // inside the row (the actions menu, an inline link cell, etc.) must
                          // keep their own behavior instead of also triggering this.
                          if ((e.target as HTMLElement).closest('button, a')) return;
                          onView(row);
                        }
                      : undefined
                  }
                >
                  {allColumns.map((col) => (
                    <td key={col.key} className={col.key === 'actions' ? 'table-cell-sticky-right' : undefined}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="table-pagination">
          {pagination.onSizeChange ? (
            <label className="table-pagination-size">
              {t('table.rowsPerPage')}
              <select
                className="table-pagination-size-select"
                value={pagination.size}
                onChange={(e) => pagination.onSizeChange?.(Number(e.target.value))}
              >
                {(PAGE_SIZE_OPTIONS.includes(pagination.size) ? PAGE_SIZE_OPTIONS : [...PAGE_SIZE_OPTIONS, pagination.size].sort((a, b) => a - b))
                  .map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
          ) : <span />}
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
                totalPages={Math.max(pagination.totalPages, 1)}
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

/**
 * The per-column filter trigger: a small funnel icon next to the header text (highlighted when
 * that column has an active filter) that opens a popover with just that column's control.
 * Portaled to <body> and positioned from the trigger's own viewport rect, same technique as
 * ActionMenu's "⋮" popover, for the same reason - table cells sit inside
 * .table-wrapper/.table-shell's overflow:auto/hidden, which would otherwise clip a popover
 * rendered inline instead of letting it float above the table.
 */
function ColumnFilterButton({
  filter,
  value,
  onChange,
}: {
  filter: DataTableColumnFilter;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;

    function onClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }
    function onScroll() {
      setOpen(false);
    }

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const toggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen((o) => !o);
  };

  const apply = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`table-filter-trigger${value ? ' active' : ''}`}
        aria-label={t('table.filterColumn')}
        aria-expanded={open}
        onClick={toggle}
      >
        <FilterIcon />
      </button>
      {open &&
        coords &&
        createPortal(
          <div ref={popoverRef} className="table-filter-popover" style={{ position: 'fixed', top: coords.top, left: coords.left }}>
            {filter.type === 'text' ? (
              <>
                <input
                  type="text"
                  className="input"
                  autoFocus
                  placeholder={filter.placeholder}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') apply(draft);
                  }}
                />
                <div className="table-filter-popover-actions">
                  <Button type="button" variant="secondary" className="btn-sm" onClick={() => apply('')}>
                    {t('common.clear')}
                  </Button>
                  <Button type="button" variant="primary" className="btn-sm" onClick={() => apply(draft)}>
                    {t('table.apply')}
                  </Button>
                </div>
              </>
            ) : (
              <select
                className="select"
                autoFocus
                value={value}
                onChange={(e) => apply(e.target.value)}
              >
                <option value="">{filter.placeholder ?? t('table.allValues')}</option>
                {filter.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

function FilterIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h18l-7 8.46V19l-4 2v-8.54L3 4Z" />
    </svg>
  );
}
