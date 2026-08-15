import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../api/attendance/attendanceApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useTimezone } from '../hooks/useTimezone';
import { Badge, Button, Card, DataTable, EmployeeSelect, Modal, PageHeader, SelectField, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { AttendanceRequest, AttendanceResponse, AttendanceStatus } from '../types/attendance';

const STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE'];

function emptyForm(): AttendanceRequest {
  return { employeeId: 0, attendanceDate: new Date().toISOString().slice(0, 10), status: 'PRESENT', remarks: '' };
}

export function AttendancePage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const { formatDate } = useTimezone();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AttendanceRequest>(emptyForm());
  const [editing, setEditing] = useState<AttendanceResponse | null>(null);

  const canWrite = hasPermission('attendance.write');
  const canDelete = hasPermission('attendance.delete');

  const { data, isLoading } = useQuery({ queryKey: ['attendance'], queryFn: () => attendanceApi.list(0, 50) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['attendance'] });

  const createMutation = useMutation({
    mutationFn: (request: AttendanceRequest) => attendanceApi.create(request),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm());
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: AttendanceRequest }) => attendanceApi.update(id, request),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => attendanceApi.delete(id),
    onSuccess: invalidate,
  });

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate(form);
  };

  const handleUpdate = (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    updateMutation.mutate({
      id: editing.id,
      request: { employeeId: editing.employeeId, attendanceDate: editing.attendanceDate, status: editing.status, remarks: editing.remarks ?? '' },
    });
  };

  const columns: DataTableColumn<AttendanceResponse>[] = [
    { key: 'date', header: t('fields.date'), render: (r) => formatDate(r.attendanceDate) },
    { key: 'employee', header: t('common.selectEmployee'), render: (r) => r.employeeName },
    { key: 'status', header: t('fields.status'), render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    { key: 'remarks', header: t('fields.remarks'), render: (r) => r.remarks ?? '-' },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (r) => (
        <div className="row-actions">
          {canWrite && <Button variant="secondary" onClick={() => setEditing(r)}>{t('common.edit')}</Button>}
          {canDelete && (
            <Button variant="danger" onClick={() => window.confirm(t('common.confirmDelete')) && deleteMutation.mutate(r.id)}>
              {t('common.delete')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('pages.attendance.title')} description={t('pages.attendance.description')} />

      {canWrite && (
        <Card style={{ marginBottom: 24 }}>
          <h2 style={{ marginTop: 0 }}>{t('pages.attendance.createTitle')}</h2>
          <form onSubmit={handleCreate} className="form-grid">
            <EmployeeSelect value={form.employeeId || ''} onChange={(id) => setForm({ ...form, employeeId: id })} required />
            <TextField label={t('fields.date')} type="date" value={form.attendanceDate} onChange={(e) => setForm({ ...form, attendanceDate: e.target.value })} required />
            <SelectField label={t('fields.status')} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AttendanceStatus })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </SelectField>
            <TextField label={t('fields.remarks')} value={form.remarks ?? ''} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending || !form.employeeId}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <DataTable columns={columns} rows={data?.content ?? []} isLoading={isLoading} getRowKey={(r) => r.id} />

      {editing && (
        <Modal title={t('pages.attendance.editTitle')} onClose={() => setEditing(null)}>
          <form onSubmit={handleUpdate} className="form-grid">
            <TextField label={t('fields.date')} type="date" value={editing.attendanceDate} onChange={(e) => setEditing({ ...editing, attendanceDate: e.target.value })} required />
            <SelectField label={t('fields.status')} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as AttendanceStatus })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </SelectField>
            <TextField label={t('fields.remarks')} value={editing.remarks ?? ''} onChange={(e) => setEditing({ ...editing, remarks: e.target.value })} />
            <div className="form-actions">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t('common.saving') : t('common.save')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
