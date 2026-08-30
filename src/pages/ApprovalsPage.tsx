import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '../api/attendance/leaveApi';
import { overtimeApi } from '../api/attendance/overtimeApi';
import { regularizationApi } from '../api/attendance/regularizationApi';
import { loanApi } from '../api/finance/loanApi';
import { reimbursementApi } from '../api/finance/reimbursementApi';
import { travelApi } from '../api/hr/travelApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { ApprovalActions, Button, DataTable, PageHeader } from '../components/ui';
import type { DataTableColumn } from '../components/ui';

// Real unified inbox: merges each module's own pending requests into one view, client-side -
// none of the underlying list endpoints support cross-module server-side filtering, and adding
// one purely to back this page isn't worth it while every module's own pending queue stays
// small (see the size=100 fetch below). If any one module's queue grows past that, this page
// needs a real backend aggregation endpoint instead of raising the page size further.

type ApprovalModule = 'Leave' | 'Overtime' | 'Regularization' | 'Loan' | 'Reimbursement' | 'Travel';

interface ApprovalItem {
  key: string;
  module: ApprovalModule;
  id: number;
  requestedByName: string;
  summary: string;
  requestedOn: string;
  canManage: boolean;
  onApprove: () => void;
  onReject: () => void;
}

const MODULES: ApprovalModule[] = ['Leave', 'Overtime', 'Regularization', 'Loan', 'Reimbursement', 'Travel'];
const FETCH_SIZE = 100;

export function ApprovalsPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [activeModule, setActiveModule] = useState<ApprovalModule | 'All'>('All');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['approvals-inbox'] });

  const leaveMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'APPROVED' | 'REJECTED' }) => leaveApi.updateStatus(id, { status }),
    onSuccess: invalidate,
  });
  const overtimeMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'APPROVED' | 'REJECTED' }) => overtimeApi.updateStatus(id, { status }),
    onSuccess: invalidate,
  });
  const regularizationMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'APPROVED' | 'REJECTED' }) => regularizationApi.updateStatus(id, { status }),
    onSuccess: invalidate,
  });
  const loanMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'APPROVED' | 'REJECTED' }) => loanApi.updateStatus(id, { status }),
    onSuccess: invalidate,
  });
  const reimbursementMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'APPROVED' | 'REJECTED' }) => reimbursementApi.updateStatus(id, { status }),
    onSuccess: invalidate,
  });
  const travelMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'APPROVED' | 'REJECTED' }) => travelApi.updateStatus(id, { status }),
    onSuccess: invalidate,
  });

  const canLeave = hasPermission('leave.write');
  const canOvertime = hasPermission('overtime.write');
  const canRegularization = hasPermission('regularization.write');
  const canLoan = hasPermission('finance.loan.write');
  const canReimbursement = hasPermission('finance.reimbursement.write');
  const canTravel = hasPermission('travel.approve');

  const { data, isLoading } = useQuery({
    queryKey: ['approvals-inbox'],
    queryFn: async () => {
      const [leave, overtime, regularization, loan, reimbursement, travel] = await Promise.all([
        leaveApi.list(0, FETCH_SIZE),
        overtimeApi.list(0, FETCH_SIZE),
        regularizationApi.list(0, FETCH_SIZE),
        loanApi.list(0, FETCH_SIZE),
        reimbursementApi.list(0, FETCH_SIZE),
        travelApi.list(0, FETCH_SIZE),
      ]);

      const items: ApprovalItem[] = [
        ...leave.content.filter((r) => r.status === 'PENDING').map((r) => ({
          key: `leave-${r.id}`,
          module: 'Leave' as const,
          id: r.id,
          requestedByName: r.employeeName,
          summary: `${r.leaveType.replace('_', ' ')}, ${r.startDate} - ${r.endDate}`,
          requestedOn: r.startDate,
          canManage: canLeave,
          onApprove: () => leaveMutation.mutate({ id: r.id, status: 'APPROVED' }),
          onReject: () => leaveMutation.mutate({ id: r.id, status: 'REJECTED' }),
        })),
        ...overtime.content.filter((r) => r.status === 'PENDING').map((r) => ({
          key: `overtime-${r.id}`,
          module: 'Overtime' as const,
          id: r.id,
          requestedByName: r.employeeName,
          summary: `${r.hours}h overtime, ${r.workDate}`,
          requestedOn: r.workDate,
          canManage: canOvertime,
          onApprove: () => overtimeMutation.mutate({ id: r.id, status: 'APPROVED' }),
          onReject: () => overtimeMutation.mutate({ id: r.id, status: 'REJECTED' }),
        })),
        ...regularization.content.filter((r) => r.status === 'PENDING').map((r) => ({
          key: `regularization-${r.id}`,
          module: 'Regularization' as const,
          id: r.id,
          requestedByName: r.employeeName,
          summary: `Requested ${r.requestedStatus.replace('_', ' ')}, ${r.attendanceDate}`,
          requestedOn: r.attendanceDate,
          canManage: canRegularization,
          onApprove: () => regularizationMutation.mutate({ id: r.id, status: 'APPROVED' }),
          onReject: () => regularizationMutation.mutate({ id: r.id, status: 'REJECTED' }),
        })),
        ...loan.content.filter((r) => r.status === 'PENDING').map((r) => ({
          key: `loan-${r.id}`,
          module: 'Loan' as const,
          id: r.id,
          requestedByName: r.employeeName,
          summary: `Loan/advance, ${r.amount.toLocaleString()}`,
          requestedOn: r.requestedDate,
          canManage: canLoan,
          onApprove: () => loanMutation.mutate({ id: r.id, status: 'APPROVED' }),
          onReject: () => loanMutation.mutate({ id: r.id, status: 'REJECTED' }),
        })),
        ...reimbursement.content.filter((r) => r.status === 'PENDING').map((r) => ({
          key: `reimbursement-${r.id}`,
          module: 'Reimbursement' as const,
          id: r.id,
          requestedByName: r.employeeName,
          summary: `${r.category ?? 'Reimbursement'}, ${r.amount.toLocaleString()}`,
          requestedOn: r.submittedDate,
          canManage: canReimbursement,
          onApprove: () => reimbursementMutation.mutate({ id: r.id, status: 'APPROVED' }),
          onReject: () => reimbursementMutation.mutate({ id: r.id, status: 'REJECTED' }),
        })),
        ...travel.content.filter((r) => r.status === 'PENDING').map((r) => ({
          key: `travel-${r.id}`,
          module: 'Travel' as const,
          id: r.id,
          requestedByName: r.employeeName,
          summary: `${r.destination}, ${r.fromDate} - ${r.toDate}`,
          requestedOn: r.fromDate,
          canManage: canTravel,
          onApprove: () => travelMutation.mutate({ id: r.id, status: 'APPROVED' }),
          onReject: () => travelMutation.mutate({ id: r.id, status: 'REJECTED' }),
        })),
      ];

      return items.sort((a, b) => b.requestedOn.localeCompare(a.requestedOn));
    },
  });

  const items = data ?? [];
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
        <ApprovalActions status="PENDING" canManage={r.canManage} onApprove={r.onApprove} onReject={r.onReject} />
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

      <DataTable columns={columns} rows={filtered} isLoading={isLoading} getRowKey={(r) => r.key} viewKey="approvals" />
    </div>
  );
}
