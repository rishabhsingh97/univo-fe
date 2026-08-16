import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollRunApi } from '../api/payroll/payrollRunApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useTimezone } from '../hooks/useTimezone';
import { Badge, Button, Modal, PageHeader, PagedDataTable, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { PayrollRunRequest, PayrollRunResponse, PayslipResponse } from '../types/payroll';

function emptyForm(): PayrollRunRequest {
  const now = new Date();
  return { periodMonth: now.getMonth() + 1, periodYear: now.getFullYear() };
}

export function PayrollPage() {
  const { t } = useLocale();
  const { format } = useTimezone();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<PayrollRunRequest>(emptyForm());
  const [showCreate, setShowCreate] = useState(false);
  const [viewingPayslipsFor, setViewingPayslipsFor] = useState<PayrollRunResponse | null>(null);

  const canWrite = hasPermission('payroll.run.write');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });

  const createMutation = useMutation({
    mutationFn: (request: PayrollRunRequest) => payrollRunApi.create(request),
    onSuccess: () => { invalidate(); setForm(emptyForm()); setShowCreate(false); },
  });

  const processMutation = useMutation({
    mutationFn: (id: number) => payrollRunApi.process(id),
    onSuccess: invalidate,
  });

  const columns: DataTableColumn<PayrollRunResponse>[] = [
    { key: 'period', header: 'Period', render: (r) => `${r.periodMonth}/${r.periodYear}`, sortKey: 'periodYear' },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>, sortKey: 'status' },
    { key: 'runDate', header: 'Run date', render: (r) => (r.runDate ? format(r.runDate) : '-'), sortKey: 'runDate' },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (r) => (
        <div className="row-actions">
          {canWrite && r.status === 'DRAFT' && (
            <Button variant="secondary" disabled={processMutation.isPending} onClick={() => processMutation.mutate(r.id)}>
              {t('pages.payroll.process')}
            </Button>
          )}
          <Button variant="secondary" onClick={() => setViewingPayslipsFor(r)}>
            {t('pages.payroll.viewPayslips')}
          </Button>
        </div>
      ),
    },
  ];

  const payslipColumns: DataTableColumn<PayslipResponse>[] = [
    { key: 'employee', header: t('common.selectEmployee'), render: (p) => p.employeeName },
    { key: 'grossPay', header: t('fields.amount'), render: (p) => p.grossPay },
    { key: 'deductions', header: t('pages.payroll.deductions'), render: (p) => p.deductions },
    { key: 'netPay', header: t('pages.payroll.netPay'), render: (p) => p.netPay },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.payroll.title')}
        description={t('pages.payroll.description')}
        actions={canWrite ? <Button onClick={() => setShowCreate(true)}>{t('pages.payroll.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.payroll.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createMutation.mutate(form); }} className="form-grid">
            <TextField label={t('fields.periodMonth')} type="number" min={1} max={12} value={form.periodMonth}
              onChange={(e) => setForm({ ...form, periodMonth: Number(e.target.value) })} required />
            <TextField label={t('fields.periodYear')} type="number" value={form.periodYear}
              onChange={(e) => setForm({ ...form, periodYear: Number(e.target.value) })} required />
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      <PagedDataTable columns={columns} queryKey={['payroll-runs']} fetchPage={payrollRunApi.list} getRowKey={(r) => r.id} />

      {viewingPayslipsFor && (
        <Modal
          title={`${t('pages.payroll.payslipsTitle')} – ${viewingPayslipsFor.periodMonth}/${viewingPayslipsFor.periodYear}`}
          onClose={() => setViewingPayslipsFor(null)}
        >
          <PagedDataTable
            columns={payslipColumns}
            queryKey={['payslips', 'run', viewingPayslipsFor.id]}
            fetchPage={(page, size, sort) => payrollRunApi.payslipsForRun(viewingPayslipsFor.id, page, size, sort)}
            getRowKey={(p) => p.id}
          />
        </Modal>
      )}
    </div>
  );
}
