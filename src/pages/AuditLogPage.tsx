import { auditLogApi } from '../api/admin/auditLogApi';
import { useLocale } from '../context/LocaleContext';
import { useTimezone } from '../hooks/useTimezone';
import { PageHeader, PagedDataTable } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { AuditLogEntryResponse } from '../types/admin';

export function AuditLogPage() {
  const { t } = useLocale();
  const { format } = useTimezone();

  const columns: DataTableColumn<AuditLogEntryResponse>[] = [
    { key: 'time', header: 'When', render: (e) => format(e.performedAt), sortKey: 'performedAt' },
    { key: 'action', header: 'Action', render: (e) => e.action, sortKey: 'action' },
    { key: 'entity', header: 'Entity', render: (e) => `${e.entityName} #${e.entityId}`, sortKey: 'entityName' },
    { key: 'by', header: 'By', render: (e) => e.performedBy, sortKey: 'performedBy' },
    { key: 'details', header: 'Details', render: (e) => e.details ?? '-' },
  ];

  return (
    <div>
      <PageHeader title={t('pages.auditLog.title')} description={t('pages.auditLog.description')} />
      <PagedDataTable columns={columns} queryKey={['audit-log']} fetchPage={auditLogApi.list} getRowKey={(e) => e.id} />
    </div>
  );
}
