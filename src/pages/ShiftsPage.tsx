import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftApi } from '../api/attendance/shiftApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Button, Modal, PageHeader, PagedDataTable, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { ShiftRequest, ShiftResponse } from '../types/attendance';

function emptyForm(): ShiftRequest {
  return { name: '', code: '', startTime: '09:00', endTime: '18:00', graceMinutes: 0 };
}

export function ShiftsPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ShiftRequest>(emptyForm());
  const [editing, setEditing] = useState<ShiftResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const canWrite = hasPermission('shift.write');
  const canDelete = hasPermission('shift.delete');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['shifts'] });

  const createMutation = useMutation({
    mutationFn: (request: ShiftRequest) => shiftApi.create(request),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm());
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: ShiftRequest }) => shiftApi.update(id, request),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => shiftApi.delete(id),
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
        name: editing.name,
        code: editing.code,
        startTime: editing.startTime,
        endTime: editing.endTime,
        graceMinutes: editing.graceMinutes,
      },
    });
  };

  const columns: DataTableColumn<ShiftResponse>[] = [
    { key: 'name', header: t('fields.name'), render: (s) => s.name, sortKey: 'name' },
    { key: 'code', header: t('fields.code'), render: (s) => s.code, sortKey: 'code' },
    { key: 'start', header: t('fields.startTime'), render: (s) => s.startTime },
    { key: 'end', header: t('fields.endTime'), render: (s) => s.endTime },
    { key: 'grace', header: t('fields.graceMinutes'), render: (s) => s.graceMinutes },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.shifts.title')}
        description={t('pages.shifts.description')}
        actions={canWrite ? <Button onClick={() => setShowCreate(true)}>{t('pages.shifts.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.shifts.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="form-grid">
            <TextField label={t('fields.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField label={t('fields.code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            <TextField label={t('fields.startTime')} type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
            <TextField label={t('fields.endTime')} type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
            <TextField label={t('fields.graceMinutes')} type="number" min={0} value={form.graceMinutes ?? 0}
              onChange={(e) => setForm({ ...form, graceMinutes: Number(e.target.value) })} />
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      <PagedDataTable
        columns={columns}
        queryKey={['shifts']}
        fetchPage={shiftApi.list}
        getRowKey={(s) => s.id}
        onEdit={canWrite ? (s) => setEditing(s) : undefined}
        onDelete={canDelete ? (s) => deleteMutation.mutate(s.id) : undefined}
      />

      {editing && (
        <Modal title={t('pages.shifts.editTitle')} onClose={() => setEditing(null)}>
          <form onSubmit={handleUpdate} className="form-grid">
            <TextField label={t('fields.name')} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
            <TextField label={t('fields.code')} value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} required />
            <TextField label={t('fields.startTime')} type="time" value={editing.startTime} onChange={(e) => setEditing({ ...editing, startTime: e.target.value })} required />
            <TextField label={t('fields.endTime')} type="time" value={editing.endTime} onChange={(e) => setEditing({ ...editing, endTime: e.target.value })} required />
            <TextField label={t('fields.graceMinutes')} type="number" min={0} value={editing.graceMinutes}
              onChange={(e) => setEditing({ ...editing, graceMinutes: Number(e.target.value) })} />
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
