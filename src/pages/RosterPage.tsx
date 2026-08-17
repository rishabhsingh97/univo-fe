import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { shiftAssignmentApi } from '../api/attendance/shiftAssignmentApi';
import { shiftApi } from '../api/attendance/shiftApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useTimezone } from '../hooks/useTimezone';
import { Button, EmployeeSelect, Modal, PageHeader, PagedDataTable, SelectField, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { ShiftAssignmentRequest, ShiftAssignmentResponse } from '../types/attendance';

function emptyForm(): ShiftAssignmentRequest {
  const today = new Date().toISOString().slice(0, 10);
  return { employeeId: 0, shiftId: 0, effectiveFrom: today, effectiveTo: null };
}

export function RosterPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const { formatDate } = useTimezone();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ShiftAssignmentRequest>(emptyForm());
  const [editing, setEditing] = useState<ShiftAssignmentResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const canWrite = hasPermission('roster.write');
  const canDelete = hasPermission('roster.delete');

  const { data: shifts } = useQuery({ queryKey: ['shifts', 'select'], queryFn: () => shiftApi.list(0, 100) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['shift-assignments'] });

  const createMutation = useMutation({
    mutationFn: (request: ShiftAssignmentRequest) => shiftAssignmentApi.create(request),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm());
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: ShiftAssignmentRequest }) => shiftAssignmentApi.update(id, request),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => shiftAssignmentApi.delete(id),
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
      request: {
        employeeId: editing.employeeId,
        shiftId: editing.shiftId,
        effectiveFrom: editing.effectiveFrom,
        effectiveTo: editing.effectiveTo,
      },
    });
  };

  const columns: DataTableColumn<ShiftAssignmentResponse>[] = [
    { key: 'employee', header: t('common.selectEmployee'), render: (a) => a.employeeName },
    { key: 'shift', header: t('fields.shift'), render: (a) => a.shiftName },
    { key: 'from', header: t('fields.effectiveFrom'), render: (a) => formatDate(a.effectiveFrom), sortKey: 'effectiveFrom' },
    { key: 'to', header: t('fields.effectiveTo'), render: (a) => (a.effectiveTo ? formatDate(a.effectiveTo) : '-') },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.roster.title')}
        description={t('pages.roster.description')}
        actions={canWrite ? <Button onClick={() => setShowCreate(true)}>{t('pages.roster.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.roster.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="form-grid">
            <EmployeeSelect value={form.employeeId || ''} onChange={(id) => setForm({ ...form, employeeId: id })} required />
            <SelectField label={t('fields.shift')} value={form.shiftId || ''}
              onChange={(e) => setForm({ ...form, shiftId: Number(e.target.value) })} required>
              <option value="">{t('common.selectOption')}</option>
              {shifts?.content.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>)}
            </SelectField>
            <TextField label={t('fields.effectiveFrom')} type="date" value={form.effectiveFrom}
              onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} required />
            <TextField label={t('fields.effectiveTo')} type="date" value={form.effectiveTo ?? ''}
              onChange={(e) => setForm({ ...form, effectiveTo: e.target.value || null })} />
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending || !form.employeeId || !form.shiftId}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      <PagedDataTable
        columns={columns}
        queryKey={['shift-assignments']}
        fetchPage={shiftAssignmentApi.list}
        getRowKey={(a) => a.id}
        onEdit={canWrite ? (a) => setEditing(a) : undefined}
        onDelete={canDelete ? (a) => deleteMutation.mutate(a.id) : undefined}
      />

      {editing && (
        <Modal title={t('pages.roster.editTitle')} onClose={() => setEditing(null)}>
          <form onSubmit={handleUpdate} className="form-grid">
            <SelectField label={t('fields.shift')} value={editing.shiftId}
              onChange={(e) => setEditing({ ...editing, shiftId: Number(e.target.value) })} required>
              {shifts?.content.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>)}
            </SelectField>
            <TextField label={t('fields.effectiveFrom')} type="date" value={editing.effectiveFrom}
              onChange={(e) => setEditing({ ...editing, effectiveFrom: e.target.value })} required />
            <TextField label={t('fields.effectiveTo')} type="date" value={editing.effectiveTo ?? ''}
              onChange={(e) => setEditing({ ...editing, effectiveTo: e.target.value || null })} />
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
