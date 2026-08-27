import { useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import { ApprovalActions, Button, DataTable, PageHeader } from '../components/ui';
import type { DataTableColumn } from '../components/ui';

// Mock-only unified inbox: aggregates what Leave/Overtime/Regularization/Loan/Reimbursement
// already approve individually on their own pages. This view does not call those APIs - it's a
// local, seeded preview of what a single cross-module inbox would look like.

type ApprovalModule = 'Leave' | 'Overtime' | 'Regularization' | 'Loan' | 'Reimbursement' | 'Travel';
type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface ApprovalItem {
  id: number;
  module: ApprovalModule;
  requestedByName: string;
  summary: string;
  requestedOn: string;
  status: ApprovalStatus;
}

const MODULES: ApprovalModule[] = ['Leave', 'Overtime', 'Regularization', 'Loan', 'Reimbursement', 'Travel'];

function seedApprovals(): ApprovalItem[] {
  return [
    { id: 1, module: 'Leave', requestedByName: 'Ananya Rao', summary: 'Annual leave, 3 days', requestedOn: '2026-08-20', status: 'PENDING' },
    { id: 2, module: 'Overtime', requestedByName: 'Vikram Shah', summary: '4 hours, 21 Aug', requestedOn: '2026-08-21', status: 'PENDING' },
    { id: 3, module: 'Regularization', requestedByName: 'Priya Nair', summary: 'Missed punch-out, 19 Aug', requestedOn: '2026-08-19', status: 'PENDING' },
    { id: 4, module: 'Loan', requestedByName: 'Rahul Mehta', summary: 'Personal loan, Rs 50,000', requestedOn: '2026-08-18', status: 'PENDING' },
    { id: 5, module: 'Reimbursement', requestedByName: 'Sneha Iyer', summary: 'Internet bill, Rs 1,200', requestedOn: '2026-08-17', status: 'APPROVED' },
    { id: 6, module: 'Travel', requestedByName: 'Arjun Kapoor', summary: 'Mumbai client visit', requestedOn: '2026-08-22', status: 'PENDING' },
  ];
}

export function ApprovalsPage() {
  const { t } = useLocale();
  const [items, setItems] = useState<ApprovalItem[]>(seedApprovals());
  const [activeModule, setActiveModule] = useState<ApprovalModule | 'All'>('All');

  const setStatus = (id: number, status: ApprovalStatus) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));

  const filtered = activeModule === 'All' ? items : items.filter((item) => item.module === activeModule);

  const columns: DataTableColumn<ApprovalItem>[] = [
    { key: 'module', header: t('pages.approvals.module'), render: (r) => r.module },
    { key: 'requestedBy', header: t('pages.approvals.requestedBy'), render: (r) => r.requestedByName },
    { key: 'summary', header: t('fields.description'), render: (r) => r.summary },
    { key: 'requestedOn', header: t('pages.approvals.requestedOn'), render: (r) => r.requestedOn },
    {
      key: 'status',
      header: t('fields.status'),
      render: (r) => (
        <ApprovalActions
          status={r.status}
          canManage
          onApprove={() => setStatus(r.id, 'APPROVED')}
          onReject={() => setStatus(r.id, 'REJECTED')}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('pages.approvals.title')} description={t('pages.approvals.description')} />

      <div className="row-actions" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Button variant={activeModule === 'All' ? 'primary' : 'secondary'} onClick={() => setActiveModule('All')}>
          {t('common.all')}
        </Button>
        {MODULES.map((m) => (
          <Button key={m} variant={activeModule === m ? 'primary' : 'secondary'} onClick={() => setActiveModule(m)}>
            {m}
          </Button>
        ))}
      </div>

      <DataTable columns={columns} rows={filtered} getRowKey={(r) => r.id} />
      <p className="field-hint" style={{ marginTop: 12 }}>{t('pages.approvals.mockNotice')}</p>
    </div>
  );
}
