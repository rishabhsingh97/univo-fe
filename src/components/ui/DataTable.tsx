import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './ui.css';
import { Spinner } from './Spinner';
import { Button } from './Button';
import { ActionMenu, deleteAction, editAction, viewAction, type ActionMenuItem } from './ActionMenu';
import { useLocale } from '../../context/LocaleContext';
import { useColumnVisibility } from '../../hooks/useColumnVisibility';
import { buildExportTable, downloadCsv, downloadXlsx } from '../../utils/exportTable';

const SELECT_COLUMN_KEY = '__select__';

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
  /** Set false to keep a column out of the `viewKey` show/hide picker entirely (e.g. a row's
   * primary identity column) - it always renders regardless of any saved preference. Defaults
   * to true; has no effect when the table has no `viewKey`. */
  hideable?: boolean;
  /** Plain value for this column when exporting to CSV/Excel. Omit to fall back to a best-effort
   * text extraction of whatever `render` returns (fine for simple text/badge cells; a column
   * whose `render` builds a multi-line/composite cell should declare this explicitly instead of
   * letting it flatten oddly). */
  exportValue?: (row: T) => string | number;
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
 *
 * Column show/hide (admin-set tenant default + per-user override, see useColumnVisibility) is
 * driven entirely by `viewKey` - a plain <DataTable> only gets the picker if the page passes
 * one explicitly, but <PagedDataTable> derives it from `queryKey` automatically, so any new
 * paginated list page gets it for free with no extra wiring. Mark a column `hideable: false`
 * (e.g. a row's primary identity column) to keep it out of the picker and always-rendered.
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
  viewKey,
  fetchAllRows,
  exportFileName,
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
  /** Stable id for this table (e.g. "employees") that opts it into a persisted column show/hide
   * picker - an admin can set the tenant-wide default for this key, each user can override it
   * for themselves. Omit to render every column unconditionally, as before this existed. Also
   * gates row-selection checkboxes and the Export button, which ride along with the same key. */
  viewKey?: string;
  /** Fetches every row matching the table's current filters/sort (not just the current page) -
   * <PagedDataTable> wires this up automatically via its own `fetchPage`. Powers Export's "All
   * pages" scope; that option is hidden when this is omitted. */
  fetchAllRows?: () => Promise<T[]>;
  /** Base filename (no extension) for CSV/Excel export. Defaults to `viewKey`. */
  exportFileName?: string;
}) {
  const { t } = useLocale();
  const resolvedEmptyMessage = emptyMessage ?? t('table.empty');

  const columnVisibility = useColumnVisibility(viewKey, columns);
  const visibleColumns = viewKey ? columns.filter((c) => columnVisibility.isVisible(c.key)) : columns;

  // Row selection (for bulk export) and the Export button ride along with `viewKey`, same as
  // the column picker - one flag opts a table into the whole bundle, no separate props to wire.
  const selectionEnabled = Boolean(viewKey);
  const [selectedRows, setSelectedRows] = useState<Map<string | number, T>>(new Map());

  const toggleRowSelection = (row: T) => {
    const key = getRowKey(row);
    setSelectedRows((current) => {
      const next = new Map(current);
      if (next.has(key)) next.delete(key);
      else next.set(key, row);
      return next;
    });
  };

  const pageKeys = rows.map(getRowKey);
  const allOnPageSelected = pageKeys.length > 0 && pageKeys.every((key) => selectedRows.has(key));
  const someOnPageSelected = pageKeys.some((key) => selectedRows.has(key));

  const toggleAllOnPage = () => {
    setSelectedRows((current) => {
      const next = new Map(current);
      if (allOnPageSelected) {
        pageKeys.forEach((key) => next.delete(key));
      } else {
        rows.forEach((row) => next.set(getRowKey(row), row));
      }
      return next;
    });
  };

  const filtersEnabled = Boolean(pagination?.onFilterChange);
  const hasRowActions = Boolean(onView || onEdit || onDelete || extraActions);
  const allColumns: DataTableColumn<T>[] = [
    ...(selectionEnabled ? [{ key: SELECT_COLUMN_KEY, header: '', render: () => null } as DataTableColumn<T>] : []),
    ...visibleColumns,
    ...(hasRowActions
      ? [
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
          } as DataTableColumn<T>,
        ]
      : []),
  ];

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

                if (col.key === SELECT_COLUMN_KEY) {
                  return (
                    <th key={col.key} className="table-cell-select">
                      <input
                        type="checkbox"
                        aria-label={t('table.selectAllOnPage')}
                        checked={allOnPageSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = !allOnPageSelected && someOnPageSelected;
                        }}
                        onChange={toggleAllOnPage}
                      />
                    </th>
                  );
                }

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
                  {allColumns.map((col) =>
                    col.key === SELECT_COLUMN_KEY ? (
                      <td key={col.key} className="table-cell-select">
                        <input
                          type="checkbox"
                          aria-label={t('table.selectRow')}
                          checked={selectedRows.has(getRowKey(row))}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleRowSelection(row)}
                        />
                      </td>
                    ) : (
                      <td key={col.key} className={col.key === 'actions' ? 'table-cell-sticky-right' : undefined}>
                        {col.render(row)}
                      </td>
                    ),
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {(pagination || viewKey) && (
        <div className="table-pagination">
          <div className="table-pagination-left">
            {viewKey && <ColumnsButton visibility={columnVisibility} />}
            {selectionEnabled && (
              <ExportButton
                columns={visibleColumns}
                pageRows={rows}
                selectedRows={selectedRows}
                fetchAllRows={fetchAllRows}
                fileNameBase={exportFileName ?? viewKey ?? 'export'}
              />
            )}
            {selectedRows.size > 0 && (
              <span className="table-selection-count">
                {t('table.selectedCount').replace('{count}', String(selectedRows.size))}
                <button type="button" className="table-columns-trigger" onClick={() => setSelectedRows(new Map())}>
                  {t('table.clearSelection')}
                </button>
              </span>
            )}
          </div>
          {pagination && (
            <div className="table-pagination-controls">
                <Button
                  type="button"
                  variant="secondary"
                  className="btn-icon"
                  aria-label={t('table.previous')}
                  title={t('table.previous')}
                  disabled={pagination.page <= 0}
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                >
                  <ChevronLeftIcon />
                </Button>
                <PageJumpInput
                  page={pagination.page}
                  totalPages={Math.max(pagination.totalPages, 1)}
                  onPageChange={pagination.onPageChange}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="btn-icon"
                  aria-label={t('table.next')}
                  title={t('table.next')}
                  disabled={pagination.page >= pagination.totalPages - 1}
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                >
                  <ChevronRightIcon />
                </Button>
                {pagination.onSizeChange && (
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
                )}
            </div>
          )}
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
 * The `viewKey` show/hide picker: a "Columns" trigger that opens a popover of checkboxes, one
 * per hideable column, plus (for admins) "Save as default for everyone" and (once the current
 * user has their own override) "Reset to default". Same portal/positioning technique as
 * ColumnFilterButton below - table cells sit inside .table-wrapper's overflow:auto, which would
 * otherwise clip a popover rendered inline.
 */
function ColumnsButton<T>({ visibility }: { visibility: ReturnType<typeof useColumnVisibility<T>> }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ bottom: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
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
      // Opens upward from the trigger (anchored via `bottom`, not `top`) since it now sits in
      // the table's footer - opening downward here would push the popover below the viewport.
      setCoords({ bottom: window.innerHeight - rect.top + 6, left: rect.left });
    }
    setOpen((o) => !o);
  };

  return (
    <>
      <button ref={triggerRef} type="button" className="table-columns-trigger" onClick={toggle}>
        <ColumnsIcon />
        {t('table.columns')}
      </button>
      {open &&
        coords &&
        createPortal(
          <div ref={popoverRef} className="table-columns-popover" style={{ position: 'fixed', bottom: coords.bottom, left: coords.left }}>
            <div className="table-columns-popover-title">{t('table.manageColumns')}</div>
            {visibility.hideableColumns.map((col) => (
              <label key={col.key} className="table-columns-option">
                <input type="checkbox" checked={visibility.isVisible(col.key)} onChange={() => visibility.toggle(col.key)} />
                {col.header}
              </label>
            ))}
            {(visibility.canManageDefault || visibility.hasOverride) && (
              <div className="table-columns-popover-actions">
                {visibility.hasOverride && (
                  <Button type="button" variant="secondary" className="btn-sm" onClick={visibility.resetToDefault}>
                    {t('table.resetToDefault')}
                  </Button>
                )}
                {visibility.canManageDefault && (
                  <Button type="button" variant="primary" className="btn-sm" onClick={visibility.saveAsDefault}>
                    {t('table.saveAsDefault')}
                  </Button>
                )}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

function ColumnsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="9" y1="4" x2="9" y2="20" />
      <line x1="15" y1="4" x2="15" y2="20" />
    </svg>
  );
}

/**
 * Export trigger next to Columns - CSV always available, Excel via ExcelJS (client-side, no
 * backend export endpoint - see buildExportTable/downloadCsv/downloadXlsx in utils/exportTable).
 * Scope defaults to the current page; "All pages" only appears when the table passed
 * `fetchAllRows` (PagedDataTable wires this up automatically), and "Selected" only appears once
 * at least one row is checked. Same portal/positioning technique as ColumnsButton.
 */
function ExportButton<T>({
  columns,
  pageRows,
  selectedRows,
  fetchAllRows,
  fileNameBase,
}: {
  columns: DataTableColumn<T>[];
  pageRows: T[];
  selectedRows: Map<string | number, T>;
  fetchAllRows?: () => Promise<T[]>;
  fileNameBase: string;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ bottom: number; left: number } | null>(null);
  const [scope, setScope] = useState<'page' | 'all' | 'selected'>('page');
  const [busy, setBusy] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
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
      setCoords({ bottom: window.innerHeight - rect.top + 6, left: rect.left });
    }
    setOpen((o) => !o);
  };

  const resolveRows = async (): Promise<T[]> => {
    if (scope === 'selected') return Array.from(selectedRows.values());
    if (scope === 'all' && fetchAllRows) return fetchAllRows();
    return pageRows;
  };

  const runExport = async (format: 'csv' | 'xlsx') => {
    setBusy(true);
    try {
      const exportRows = await resolveRows();
      const { header, body } = buildExportTable(columns, exportRows);
      if (format === 'csv') downloadCsv(fileNameBase, header, body);
      else await downloadXlsx(fileNameBase, header, body);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button ref={triggerRef} type="button" className="table-columns-trigger" onClick={toggle}>
        <ExportIcon />
        {t('table.export')}
      </button>
      {open &&
        coords &&
        createPortal(
          <div ref={popoverRef} className="table-columns-popover" style={{ position: 'fixed', bottom: coords.bottom, left: coords.left }}>
            <div className="table-columns-popover-title">{t('table.exportScope')}</div>
            <label className="table-columns-option">
              <input type="radio" name="export-scope" checked={scope === 'page'} onChange={() => setScope('page')} />
              {t('table.exportCurrentPage')}
            </label>
            {fetchAllRows && (
              <label className="table-columns-option">
                <input type="radio" name="export-scope" checked={scope === 'all'} onChange={() => setScope('all')} />
                {t('table.exportAllPages')}
              </label>
            )}
            {selectedRows.size > 0 && (
              <label className="table-columns-option">
                <input type="radio" name="export-scope" checked={scope === 'selected'} onChange={() => setScope('selected')} />
                {t('table.exportSelected').replace('{count}', String(selectedRows.size))}
              </label>
            )}
            <div className="table-columns-popover-actions">
              <Button type="button" variant="secondary" className="btn-sm" disabled={busy} onClick={() => runExport('csv')}>
                {busy ? t('table.exporting') : t('table.exportCsv')}
              </Button>
              <Button type="button" variant="primary" className="btn-sm" disabled={busy} onClick={() => runExport('xlsx')}>
                {busy ? t('table.exporting') : t('table.exportExcel')}
              </Button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <polyline points="7 10 12 15 17 10" />
      <path d="M4 19h16" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
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
