import { useQuery } from '@tanstack/react-query';
import { payrollRunApi } from '../api/payroll/payrollRunApi';
import { useLocale } from '../context/LocaleContext';
import { useTimezone } from '../hooks/useTimezone';
import { Badge, DataTable, PageHeader, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { PayrollRunResponse } from '../types/payroll';

export function PayrollPage() {
  const { t } = useLocale();
  const { format } = useTimezone();
  const { data, isLoading } = useQuery({ queryKey: ['payroll-runs'], queryFn: () => payrollRunApi.list() });

  const columns: DataTableColumn<PayrollRunResponse>[] = [
    { key: 'period', header: 'Period', render: (r) => `${r.periodMonth}/${r.periodYear}` },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    { key: 'runDate', header: 'Run date', render: (r) => (r.runDate ? format(r.runDate) : '-') },
  ];

  return (
    <div>
      <PageHeader title={t('pages.payroll.title')} description={t('pages.payroll.description')} />
      <DataTable columns={columns} rows={data ?? []} isLoading={isLoading} getRowKey={(r) => r.id} />
    </div>
  );
}
