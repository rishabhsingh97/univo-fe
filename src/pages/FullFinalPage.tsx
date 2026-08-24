import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fullFinalApi } from '../api/hr/fullFinalApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, EmployeeSelect, Modal, PageHeader, PagedDataTable, TextField, statusTone } from '../components/ui';
import type { ActionMenuItem, DataTableColumn } from '../components/ui';
import type { FullFinalRequest, FullFinalResponse } from '../types/fullFinal';

function emptyForm(): FullFinalRequest {
  return { employeeId: 0, pendingSalary: 0, leaveEncashment: 0, otherDues: 0, deductions: 0, remarks: '' };
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export function FullFinalPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FullFinalRequest>(emptyForm());
  const [showCreate, setShowCreate] = useState(false);

  const canManage = hasPermission('fullfinal.write');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['full-final'] });

  const createMutation = useMutation({
    mutationFn: (request: FullFinalRequest) => fullFinalApi.create(request),
    onSuccess: () => { invalidate(); setForm(emptyForm()); setShowCreate(false); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, paidOn }: { id: number; status: FullFinalResponse['status']; paidOn?: string }) =>
      fullFinalApi.updateStatus(id, { status, paidOn }),
    onSuccess: invalidate,
  });

  const netPreview = form.pendingSalary + form.leaveEncashment + form.otherDues - form.deductions;

  const columns: DataTableColumn<FullFinalResponse>[] = [
    { key: 'employee', header: t('common.selectEmployee'), render: (r) => r.employeeName, sortKey: 'employeeName' },
    { key: 'pendingSalary', header: t('fields.pendingSalary'), render: (r) => inr(r.pendingSalary) },
    { key: 'leaveEncashment', header: t('fields.leaveEncashment'), render: (r) => inr(r.leaveEncashment) },
    { key: 'otherDues', header: t('fields.otherDues'), render: (r) => inr(r.otherDues) },
    { key: 'gratuityAmount', header: t('fields.gratuityAmount'), render: (r) => inr(r.gratuityAmount) },
    { key: 'deductions', header: t('pages.payroll.deductions'), render: (r) => inr(r.deductions) },
    { key: 'net', header: t('fields.netSettlement'), render: (r) => <b>{inr(r.netSettlement)}</b> },
    { key: 'status', header: t('fields.status'), render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>, sortKey: 'status' },
  ];

  const extraActions = (r: FullFinalResponse): ActionMenuItem[] => {
    if (!canManage) return [];
    if (r.status === 'DRAFT') {
      return [{ label: t('pages.fullFinal.approve'), onClick: () => statusMutation.mutate({ id: r.id, status: 'APPROVED' }) }];
    }
    if (r.status === 'APPROVED') {
      return [
        {
          label: t('pages.fullFinal.markPaid'),
          onClick: () => statusMutation.mutate({ id: r.id, status: 'PAID', paidOn: new Date().toISOString().slice(0, 10) }),
        },
      ];
    }
    return [];
  };

  return (
    <div>
      <PageHeader
        title={t('pages.fullFinal.title')}
        description={t('pages.fullFinal.description')}
        actions={canManage ? <Button onClick={() => setShowCreate(true)}>{t('pages.fullFinal.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.fullFinal.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createMutation.mutate(form); }} className="form-grid">
            <EmployeeSelect value={form.employeeId || ''} onChange={(id) => setForm({ ...form, employeeId: id })} required />
            <TextField label={t('fields.pendingSalary')} type="number" value={form.pendingSalary} onChange={(e) => setForm({ ...form, pendingSalary: Number(e.target.value) })} />
            <TextField label={t('fields.leaveEncashment')} type="number" value={form.leaveEncashment} onChange={(e) => setForm({ ...form, leaveEncashment: Number(e.target.value) })} />
            <TextField label={t('fields.otherDues')} type="number" value={form.otherDues} onChange={(e) => setForm({ ...form, otherDues: Number(e.target.value) })} />
            <TextField label={t('pages.payroll.deductions')} type="number" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: Number(e.target.value) })} />
            <TextField label={t('fields.remarks')} value={form.remarks ?? ''} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            <p><b>{t('fields.netSettlement')} ({t('pages.fullFinal.excludingGratuity')}):</b> {inr(netPreview)}</p>
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending || !form.employeeId}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      <PagedDataTable
        columns={columns}
        queryKey={['full-final']}
        fetchPage={fullFinalApi.list}
        getRowKey={(r) => r.id}
        extraActions={extraActions}
      />
    </div>
  );
}
