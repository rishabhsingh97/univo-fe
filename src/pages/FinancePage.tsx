import { useQuery } from '@tanstack/react-query';
import { loanApi } from '../api/finance/loanApi';
import { reimbursementApi } from '../api/finance/reimbursementApi';
import { useLocale } from '../context/LocaleContext';
import { Badge, Card, DataTable, PageHeader, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { LoanAdvanceResponse, ReimbursementResponse } from '../types/finance';

const loanColumns: DataTableColumn<LoanAdvanceResponse>[] = [
  { key: 'employee', header: 'Employee', render: (r) => r.employeeName },
  { key: 'amount', header: 'Amount', render: (r) => r.amount },
  { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
];

const reimbursementColumns: DataTableColumn<ReimbursementResponse>[] = [
  { key: 'employee', header: 'Employee', render: (r) => r.employeeName },
  { key: 'category', header: 'Category', render: (r) => r.category ?? '-' },
  { key: 'amount', header: 'Amount', render: (r) => r.amount },
  { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
];

export function FinancePage() {
  const { t } = useLocale();
  const loans = useQuery({ queryKey: ['loans'], queryFn: () => loanApi.list(0, 50) });
  const reimbursements = useQuery({
    queryKey: ['reimbursements'],
    queryFn: () => reimbursementApi.list(0, 50),
  });

  return (
    <div>
      <PageHeader title={t('pages.finance.title')} description={t('pages.finance.description')} />
      <Card style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>{t('pages.finance.loans')}</h2>
        <DataTable columns={loanColumns} rows={loans.data?.content ?? []} isLoading={loans.isLoading} getRowKey={(r) => r.id} />
      </Card>
      <Card>
        <h2 style={{ marginTop: 0 }}>{t('pages.finance.reimbursements')}</h2>
        <DataTable
          columns={reimbursementColumns}
          rows={reimbursements.data?.content ?? []}
          isLoading={reimbursements.isLoading}
          getRowKey={(r) => r.id}
        />
      </Card>
    </div>
  );
}
