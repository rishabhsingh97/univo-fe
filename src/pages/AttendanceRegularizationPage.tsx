import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { regularizationApi } from '../api/attendance/regularizationApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useTimezone } from '../hooks/useTimezone';
import { Badge, Button, EmployeeSelect, Modal, PageHeader, PagedDataTable, SelectField, TextField, statusTone } from '../components/ui';
import type { ActionMenuItem, DataTableColumn } from '../components/ui';
import type {
  ApprovalStatus,
  AttendanceRegularizationRequest,
  AttendanceRegularizationResponse,
  AttendanceStatus,
} from '../types/attendance';

const STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE'];

function emptyForm(): AttendanceRegularizationRequest {
  const today = new Date().toISOString().slice(0, 10);
  return { employeeId: 0, attendanceDate: today, requestedStatus: 'PRESENT', reason: '' };
}

export function AttendanceRegularizationPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const { formatDate } = useTimezone();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AttendanceRegularizationRequest>(emptyForm());
  const [showCreate, setShowCreate] = useState(false);

  const canCreate = hasPermission('regularization.write');
  const canManage = hasPermission('regularization.write');
  const canDelete = hasPermission('regularization.delete');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['attendance-regularizations'] });

  const createMutation = useMutation({
    mutationFn: (request: AttendanceRegularizationRequest) => regularizationApi.create(request),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm());
      setShowCreate(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ApprovalStatus }) => regularizationApi.updateStatus(id, { status }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => regularizationApi.delete(id),
    onSuccess: invalidate,
  });

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate(form);
  };

  const columns: DataTableColumn<AttendanceRegularizationResponse>[] = [
    { key: 'employee', header: t('common.selectEmployee'), render: (r) => r.employeeName },
    { key: 'date', header: t('fields.date'), render: (r) => formatDate(r.attendanceDate), sortKey: 'attendanceDate' },
    { key: 'requestedStatus', header: t('fields.requestedStatus'), render: (r) => r.requestedStatus },
    { key: 'reason', header: t('fields.reason'), render: (r) => r.reason ?? '-' },
    {
      key: 'status',
      header: t('fields.status'),
      render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
      sortKey: 'status',
    },
  ];

  const extraActions = (r: AttendanceRegularizationResponse): ActionMenuItem[] =>
    r.status === 'PENDING' && canManage
      ? [
          { label: t('common.approve'), onClick: () => statusMutation.mutate({ id: r.id, status: 'APPROVED' }) },
          { label: t('common.reject'), onClick: () => statusMutation.mutate({ id: r.id, status: 'REJECTED' }) },
        ]
      : [];

  return (
    <div>
      <PageHeader
        title={t('pages.regularization.title')}
        description={t('pages.regularization.description')}
        actions={canCreate ? <Button onClick={() => setShowCreate(true)}>{t('pages.regularization.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.regularization.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="form-grid">
            <EmployeeSelect value={form.employeeId || ''} onChange={(id) => setForm({ ...form, employeeId: id })} required />
            <TextField label={t('fields.date')} type="date" value={form.attendanceDate} onChange={(e) => setForm({ ...form, attendanceDate: e.target.value })} required />
            <SelectField label={t('fields.requestedStatus')} value={form.requestedStatus}
              onChange={(e) => setForm({ ...form, requestedStatus: e.target.value as AttendanceStatus })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </SelectField>
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
        queryKey={['attendance-regularizations']}
        fetchPage={regularizationApi.list}
        getRowKey={(r) => r.id}
        onDelete={canDelete ? (r) => deleteMutation.mutate(r.id) : undefined}
        extraActions={extraActions}
      />
    </div>
  );
}
