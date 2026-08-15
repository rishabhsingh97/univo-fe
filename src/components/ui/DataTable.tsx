import type { ReactNode } from 'react';
import './ui.css';
import { Spinner } from './Spinner';
import { useLocale } from '../../context/LocaleContext';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

/**
 * One generic table every list page uses instead of hand-rolling <table> markup per page -
 * that's the "centralized and reusable" component for tabular data across the app.
 */
export function DataTable<T>({
  columns,
  rows,
  isLoading,
  emptyMessage,
  getRowKey,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  getRowKey: (row: T) => string | number;
}) {
  const { t } = useLocale();
  const resolvedEmptyMessage = emptyMessage ?? t('table.empty');
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
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
  );
}
