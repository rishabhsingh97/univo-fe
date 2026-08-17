import { auditLogApi } from '../api/admin/auditLogApi';
import { useTimezone } from '../hooks/useTimezone';
import { PagedDataTable } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { AuditLogEntryResponse } from '../types/admin';

/** No title of its own - only rendered as a tab inside AdministrationPage, whose tab label
 * already says "Audit Log". */
export function AuditLogPage() {
  const { format } = useTimezone();

  const columns: DataTableColumn<AuditLogEntryResponse>[] = [
    { key: 'time', header: 'When', render: (e) => format(e.performedAt), sortKey: 'performedAt' },
    { key: 'action', header: 'Action', render: (e) => e.action, sortKey: 'action' },
    { key: 'entity', header: 'Entity', render: (e) => `${e.entityName} #${e.entityId}`, sortKey: 'entityName' },
    { key: 'by', header: 'By', render: (e) => e.performedBy, sortKey: 'performedBy' },
    { key: 'details', header: 'Details', render: (e) => e.details ?? '-' },
  ];

  return <PagedDataTable columns={columns} queryKey={['audit-log']} fetchPage={auditLogApi.list} getRowKey={(e) => e.id} />;
}
