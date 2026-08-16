import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '../api/attendance/leaveApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useTimezone } from '../hooks/useTimezone';
import { ApprovalActions, Button, EmployeeSelect, Modal, PageHeader, PagedDataTable, SelectField, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { LeaveApplicationRequest, LeaveApplicationResponse, LeaveStatus, LeaveType } from '../types/attendance';

const LEAVE_TYPES: LeaveType[] = ['ANNUAL', 'SICK', 'UNPAID', 'OTHER'];

function emptyForm(): LeaveApplicationRequest {
  const today = new Date().toISOString().slice(0, 10);
  return { employeeId: 0, leaveType: 'ANNUAL', startDate: today, endDate: today, reason: '' };
}

export function LeavePage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const { formatDate } = useTimezone();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<LeaveApplicationRequest>(emptyForm());
  const [showCreate, setShowCreate] = useState(false);

  const canCreate = hasPermission('leave.write');
  const canManage = hasPermission('leave.write');
  const canDelete = hasPermission('leave.delete');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['leave-applications'] });

  const createMutation = useMutation({
    mutationFn: (request: LeaveApplicationRequest) => leaveApi.create(request),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm());
      setShowCreate(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: LeaveStatus }) => leaveApi.updateStatus(id, { status }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => leaveApi.delete(id),
    onSuccess: invalidate,
  });

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate(form);
  };

  const columns: DataTableColumn<LeaveApplicationResponse>[] = [
    { key: 'employee', header: t('common.selectEmployee'), render: (r) => r.employeeName },
    { key: 'type', header: t('fields.leaveType'), render: (r) => r.leaveType, sortKey: 'leaveType' },
    { key: 'dates', header: t('fields.date'), render: (r) => `${formatDate(r.startDate)} - ${formatDate(r.endDate)}`, sortKey: 'startDate' },
    {
      key: 'status',
      header: t('fields.status'),
      render: (r) => (
        <ApprovalActions
          status={r.status}
          canManage={canManage}
          onApprove={() => statusMutation.mutate({ id: r.id, status: 'APPROVED' })}
          onReject={() => statusMutation.mutate({ id: r.id, status: 'REJECTED' })}
        />
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (r) =>
        canDelete ? (
          <Button variant="danger" onClick={() => window.confirm(t('common.confirmDelete')) && deleteMutation.mutate(r.id)}>
            {t('common.delete')}
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.leave.title')}
        description={t('pages.leave.description')}
        actions={canCreate ? <Button onClick={() => setShowCreate(true)}>{t('pages.leave.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.leave.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="form-grid">
            <EmployeeSelect value={form.employeeId || ''} onChange={(id) => setForm({ ...form, employeeId: id })} required />
            <SelectField label={t('fields.leaveType')} value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value as LeaveType })}>
              {LEAVE_TYPES.map((lt) => <option key={lt} value={lt}>{lt}</option>)}
            </SelectField>
            <TextField label={t('fields.startDate')} type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            <TextField label={t('fields.endDate')} type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
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

      <PagedDataTable columns={columns} queryKey={['leave-applications']} fetchPage={leaveApi.list} getRowKey={(r) => r.id} />
    </div>
  );
}
