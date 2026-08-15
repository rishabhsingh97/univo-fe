import { useQuery } from '@tanstack/react-query';
import { auditLogApi } from '../api/admin/auditLogApi';
import { useLocale } from '../context/LocaleContext';
import { useTimezone } from '../hooks/useTimezone';
import { DataTable, PageHeader } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { AuditLogEntryResponse } from '../types/admin';

export function AuditLogPage() {
  const { t } = useLocale();
  const { format } = useTimezone();
  const { data, isLoading } = useQuery({ queryKey: ['audit-log'], queryFn: () => auditLogApi.list(0, 50) });

  const columns: DataTableColumn<AuditLogEntryResponse>[] = [
    { key: 'time', header: 'When', render: (e) => format(e.performedAt) },
    { key: 'action', header: 'Action', render: (e) => e.action },
    { key: 'entity', header: 'Entity', render: (e) => `${e.entityName} #${e.entityId}` },
    { key: 'by', header: 'By', render: (e) => e.performedBy },
    { key: 'details', header: 'Details', render: (e) => e.details ?? '-' },
  ];

  return (
    <div>
      <PageHeader title={t('pages.auditLog.title')} description={t('pages.auditLog.description')} />
      <DataTable columns={columns} rows={data?.content ?? []} isLoading={isLoading} getRowKey={(e) => e.id} />
    </div>
  );
}
