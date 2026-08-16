import { payrollRunApi } from '../api/payroll/payrollRunApi';
import { useLocale } from '../context/LocaleContext';
import { useTimezone } from '../hooks/useTimezone';
import { Badge, PageHeader, PagedDataTable, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { PayrollRunResponse } from '../types/payroll';

export function PayrollPage() {
  const { t } = useLocale();
  const { format } = useTimezone();

  const columns: DataTableColumn<PayrollRunResponse>[] = [
    { key: 'period', header: 'Period', render: (r) => `${r.periodMonth}/${r.periodYear}`, sortKey: 'periodYear' },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>, sortKey: 'status' },
    { key: 'runDate', header: 'Run date', render: (r) => (r.runDate ? format(r.runDate) : '-'), sortKey: 'runDate' },
  ];

  return (
    <div>
      <PageHeader title={t('pages.payroll.title')} description={t('pages.payroll.description')} />
      <PagedDataTable columns={columns} queryKey={['payroll-runs']} fetchPage={payrollRunApi.list} getRowKey={(r) => r.id} />
    </div>
  );
}
