import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { overtimeApi } from '../api/attendance/overtimeApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useTimezone } from '../hooks/useTimezone';
import { Badge, Button, EmployeeSelect, Modal, PageHeader, PagedDataTable, TextField, statusTone } from '../components/ui';
import type { ActionMenuItem, DataTableColumn } from '../components/ui';
import type { ApprovalStatus, OvertimeRequest, OvertimeResponse } from '../types/attendance';

function emptyForm(): OvertimeRequest {
  const today = new Date().toISOString().slice(0, 10);
  return { employeeId: 0, workDate: today, hours: 1, reason: '' };
}

export function OvertimePage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const { formatDate } = useTimezone();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<OvertimeRequest>(emptyForm());
  const [showCreate, setShowCreate] = useState(false);

  const canCreate = hasPermission('overtime.write');
  const canManage = hasPermission('overtime.write');
  const canDelete = hasPermission('overtime.delete');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['overtime-records'] });

  const createMutation = useMutation({
    mutationFn: (request: OvertimeRequest) => overtimeApi.create(request),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm());
      setShowCreate(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ApprovalStatus }) => overtimeApi.updateStatus(id, { status }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => overtimeApi.delete(id),
    onSuccess: invalidate,
  });

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate(form);
  };

  const columns: DataTableColumn<OvertimeResponse>[] = [
    { key: 'employee', header: t('common.selectEmployee'), render: (r) => r.employeeName },
    { key: 'date', header: t('fields.date'), render: (r) => formatDate(r.workDate), sortKey: 'workDate' },
    { key: 'hours', header: t('fields.hours'), render: (r) => r.hours },
    { key: 'reason', header: t('fields.reason'), render: (r) => r.reason ?? '-' },
    {
      key: 'status',
      header: t('fields.status'),
      render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
      sortKey: 'status',
    },
  ];

  const extraActions = (r: OvertimeResponse): ActionMenuItem[] =>
    r.status === 'PENDING' && canManage
      ? [
          { label: t('common.approve'), onClick: () => statusMutation.mutate({ id: r.id, status: 'APPROVED' }) },
          { label: t('common.reject'), onClick: () => statusMutation.mutate({ id: r.id, status: 'REJECTED' }) },
        ]
      : [];

  return (
    <div>
      <PageHeader
        title={t('pages.overtime.title')}
        description={t('pages.overtime.description')}
        actions={canCreate ? <Button onClick={() => setShowCreate(true)}>{t('pages.overtime.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.overtime.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="form-grid">
            <EmployeeSelect value={form.employeeId || ''} onChange={(id) => setForm({ ...form, employeeId: id })} required />
            <TextField label={t('fields.date')} type="date" value={form.workDate} onChange={(e) => setForm({ ...form, workDate: e.target.value })} required />
            <TextField label={t('fields.hours')} type="number" step="0.25" min="0.25" max="24" value={form.hours}
              onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })} required />
            <TextField label={t('fields.reason')} value={form.reason ?? ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
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
        queryKey={['overtime-records']}
        fetchPage={overtimeApi.list}
        getRowKey={(r) => r.id}
        onDelete={canDelete ? (r) => deleteMutation.mutate(r.id) : undefined}
        extraActions={extraActions}
      />
    </div>
  );
}
