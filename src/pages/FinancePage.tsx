import { loanApi } from '../api/finance/loanApi';
import { reimbursementApi } from '../api/finance/reimbursementApi';
import { useLocale } from '../context/LocaleContext';
import { Badge, Card, PageHeader, PagedDataTable, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { LoanAdvanceResponse, ReimbursementResponse } from '../types/finance';

const loanColumns: DataTableColumn<LoanAdvanceResponse>[] = [
  { key: 'employee', header: 'Employee', render: (r) => r.employeeName },
  { key: 'amount', header: 'Amount', render: (r) => r.amount, sortKey: 'amount' },
  { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>, sortKey: 'status' },
];

const reimbursementColumns: DataTableColumn<ReimbursementResponse>[] = [
  { key: 'employee', header: 'Employee', render: (r) => r.employeeName },
  { key: 'category', header: 'Category', render: (r) => r.category ?? '-', sortKey: 'category' },
  { key: 'amount', header: 'Amount', render: (r) => r.amount, sortKey: 'amount' },
  { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>, sortKey: 'status' },
];

export function FinancePage() {
  const { t } = useLocale();

  return (
    <div>
      <PageHeader title={t('pages.finance.title')} description={t('pages.finance.description')} />
      <Card style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>{t('pages.finance.loans')}</h2>
        <PagedDataTable columns={loanColumns} queryKey={['loans']} fetchPage={loanApi.list} getRowKey={(r) => r.id} />
      </Card>
      <Card>
        <h2 style={{ marginTop: 0 }}>{t('pages.finance.reimbursements')}</h2>
        <PagedDataTable
          columns={reimbursementColumns}
          queryKey={['reimbursements']}
          fetchPage={reimbursementApi.list}
          getRowKey={(r) => r.id}
        />
      </Card>
    </div>
  );
}
