import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loanApi } from '../api/finance/loanApi';
import { reimbursementApi } from '../api/finance/reimbursementApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { ApprovalActions, Button, Card, EmployeeSelect, Modal, PageHeader, PagedDataTable, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type {
  LoanAdvanceRequest,
  LoanAdvanceResponse,
  ReimbursementRequest,
  ReimbursementResponse,
  RequestStatus,
} from '../types/finance';

function emptyLoanForm(): LoanAdvanceRequest {
  return { employeeId: 0, amount: 0, reason: '', requestedDate: new Date().toISOString().slice(0, 10) };
}

function emptyReimbursementForm(): ReimbursementRequest {
  return { employeeId: 0, amount: 0, category: '', description: '', submittedDate: new Date().toISOString().slice(0, 10) };
}

export function FinancePage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const canManageLoans = hasPermission('finance.loan.write');
  const canManageReimbursements = hasPermission('finance.reimbursement.write');

  const [loanForm, setLoanForm] = useState<LoanAdvanceRequest>(emptyLoanForm());
  const [showLoanCreate, setShowLoanCreate] = useState(false);

  const invalidateLoans = () => queryClient.invalidateQueries({ queryKey: ['loans'] });

  const createLoanMutation = useMutation({
    mutationFn: (request: LoanAdvanceRequest) => loanApi.create(request),
    onSuccess: () => {
      invalidateLoans();
      setLoanForm(emptyLoanForm());
      setShowLoanCreate(false);
    },
  });

  const loanStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: RequestStatus }) => loanApi.updateStatus(id, { status }),
    onSuccess: invalidateLoans,
  });

  const [reimbursementForm, setReimbursementForm] = useState<ReimbursementRequest>(emptyReimbursementForm());
  const [showReimbursementCreate, setShowReimbursementCreate] = useState(false);

  const invalidateReimbursements = () => queryClient.invalidateQueries({ queryKey: ['reimbursements'] });

  const createReimbursementMutation = useMutation({
    mutationFn: (request: ReimbursementRequest) => reimbursementApi.create(request),
    onSuccess: () => {
      invalidateReimbursements();
      setReimbursementForm(emptyReimbursementForm());
      setShowReimbursementCreate(false);
    },
  });

  const reimbursementStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: RequestStatus }) => reimbursementApi.updateStatus(id, { status }),
    onSuccess: invalidateReimbursements,
  });

  const loanColumns: DataTableColumn<LoanAdvanceResponse>[] = [
    { key: 'employee', header: t('common.selectEmployee'), render: (r) => r.employeeName },
    { key: 'amount', header: t('fields.amount'), render: (r) => r.amount, sortKey: 'amount' },
    {
      key: 'status',
      header: t('fields.status'),
      render: (r) => (
        <ApprovalActions
          status={r.status}
          canManage={canManageLoans}
          onApprove={() => loanStatusMutation.mutate({ id: r.id, status: 'APPROVED' })}
          onReject={() => loanStatusMutation.mutate({ id: r.id, status: 'REJECTED' })}
        />
      ),
      sortKey: 'status',
    },
  ];

  const reimbursementColumns: DataTableColumn<ReimbursementResponse>[] = [
    { key: 'employee', header: t('common.selectEmployee'), render: (r) => r.employeeName },
    { key: 'category', header: t('fields.category'), render: (r) => r.category ?? '-', sortKey: 'category' },
    { key: 'amount', header: t('fields.amount'), render: (r) => r.amount, sortKey: 'amount' },
    {
      key: 'status',
      header: t('fields.status'),
      render: (r) => (
        <ApprovalActions
          status={r.status}
          canManage={canManageReimbursements}
          onApprove={() => reimbursementStatusMutation.mutate({ id: r.id, status: 'APPROVED' })}
          onReject={() => reimbursementStatusMutation.mutate({ id: r.id, status: 'REJECTED' })}
        />
      ),
      sortKey: 'status',
    },
  ];

  return (
    <div>
      <PageHeader title={t('pages.finance.title')} description={t('pages.finance.description')} />

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>{t('pages.finance.loans')}</h2>
          {canManageLoans && <Button onClick={() => setShowLoanCreate(true)}>{t('pages.finance.addLoan')}</Button>}
        </div>
        <PagedDataTable columns={loanColumns} queryKey={['loans']} fetchPage={loanApi.list} getRowKey={(r) => r.id} />
      </Card>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>{t('pages.finance.reimbursements')}</h2>
          {canManageReimbursements && (
            <Button onClick={() => setShowReimbursementCreate(true)}>{t('pages.finance.addReimbursement')}</Button>
          )}
        </div>
        <PagedDataTable
          columns={reimbursementColumns}
          queryKey={['reimbursements']}
          fetchPage={reimbursementApi.list}
          getRowKey={(r) => r.id}
        />
      </Card>

      {showLoanCreate && (
        <Modal title={t('pages.finance.addLoan')} onClose={() => setShowLoanCreate(false)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              createLoanMutation.mutate(loanForm);
            }}
            className="form-grid"
          >
            <EmployeeSelect value={loanForm.employeeId || ''} onChange={(id) => setLoanForm({ ...loanForm, employeeId: id })} required />
            <TextField
              label={t('fields.amount')}
              type="number"
              step="0.01"
              value={loanForm.amount}
              onChange={(e) => setLoanForm({ ...loanForm, amount: Number(e.target.value) })}
              required
            />
            <TextField
              label={t('fields.requestedDate')}
              type="date"
              value={loanForm.requestedDate}
              onChange={(e) => setLoanForm({ ...loanForm, requestedDate: e.target.value })}
              required
            />
            <TextField
              label={t('fields.reason')}
              value={loanForm.reason ?? ''}
              onChange={(e) => setLoanForm({ ...loanForm, reason: e.target.value })}
            />
            <div className="form-actions">
              <Button type="submit" disabled={createLoanMutation.isPending || !loanForm.employeeId}>
                {createLoanMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowLoanCreate(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {showReimbursementCreate && (
        <Modal title={t('pages.finance.addReimbursement')} onClose={() => setShowReimbursementCreate(false)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              createReimbursementMutation.mutate(reimbursementForm);
            }}
            className="form-grid"
          >
            <EmployeeSelect
              value={reimbursementForm.employeeId || ''}
              onChange={(id) => setReimbursementForm({ ...reimbursementForm, employeeId: id })}
              required
            />
            <TextField
              label={t('fields.amount')}
              type="number"
              step="0.01"
              value={reimbursementForm.amount}
              onChange={(e) => setReimbursementForm({ ...reimbursementForm, amount: Number(e.target.value) })}
              required
            />
            <TextField
              label={t('fields.category')}
              value={reimbursementForm.category ?? ''}
              onChange={(e) => setReimbursementForm({ ...reimbursementForm, category: e.target.value })}
            />
            <TextField
              label={t('fields.submittedDate')}
              type="date"
              value={reimbursementForm.submittedDate}
              onChange={(e) => setReimbursementForm({ ...reimbursementForm, submittedDate: e.target.value })}
              required
            />
            <TextField
              label={t('fields.description')}
              value={reimbursementForm.description ?? ''}
              onChange={(e) => setReimbursementForm({ ...reimbursementForm, description: e.target.value })}
            />
            <div className="form-actions">
              <Button type="submit" disabled={createReimbursementMutation.isPending || !reimbursementForm.employeeId}>
                {createReimbursementMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowReimbursementCreate(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
