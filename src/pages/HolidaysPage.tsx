import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { holidayApi } from '../api/attendance/holidayApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useTimezone } from '../hooks/useTimezone';
import { Button, Modal, PageHeader, PagedDataTable, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { HolidayRequest, HolidayResponse } from '../types/attendance';

function emptyForm(): HolidayRequest {
  return { name: '', holidayDate: new Date().toISOString().slice(0, 10), recurringYearly: false };
}

export function HolidaysPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const { formatDate } = useTimezone();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<HolidayRequest>(emptyForm());
  const [editing, setEditing] = useState<HolidayResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const canWrite = hasPermission('holiday.write');
  const canDelete = hasPermission('holiday.delete');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['holidays'] });

  const createMutation = useMutation({
    mutationFn: (request: HolidayRequest) => holidayApi.create(request),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm());
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: HolidayRequest }) => holidayApi.update(id, request),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => holidayApi.delete(id),
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
      request: { name: editing.name, holidayDate: editing.holidayDate, recurringYearly: editing.recurringYearly },
    });
  };

  const columns: DataTableColumn<HolidayResponse>[] = [
    { key: 'name', header: t('fields.name'), render: (h) => h.name, sortKey: 'name' },
    { key: 'date', header: t('fields.date'), render: (h) => formatDate(h.holidayDate), sortKey: 'holidayDate' },
    { key: 'recurring', header: t('fields.recurringYearly'), render: (h) => (h.recurringYearly ? 'Yes' : 'No'), sortKey: 'recurringYearly' },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (h) => (
        <div className="row-actions">
          {canWrite && <Button variant="secondary" onClick={() => setEditing(h)}>{t('common.edit')}</Button>}
          {canDelete && (
            <Button variant="danger" onClick={() => window.confirm(t('common.confirmDelete')) && deleteMutation.mutate(h.id)}>
              {t('common.delete')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.holidays.title')}
        description={t('pages.holidays.description')}
        actions={canWrite ? <Button onClick={() => setShowCreate(true)}>{t('pages.holidays.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.holidays.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="form-grid">
            <TextField label={t('fields.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField label={t('fields.date')} type="date" value={form.holidayDate} onChange={(e) => setForm({ ...form, holidayDate: e.target.value })} required />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.recurringYearly} onChange={(e) => setForm({ ...form, recurringYearly: e.target.checked })} />
              {t('fields.recurringYearly')}
            </label>
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      <PagedDataTable columns={columns} queryKey={['holidays']} fetchPage={holidayApi.list} getRowKey={(h) => h.id} />

      {editing && (
        <Modal title={t('pages.holidays.editTitle')} onClose={() => setEditing(null)}>
          <form onSubmit={handleUpdate} className="form-grid">
            <TextField label={t('fields.name')} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
            <TextField label={t('fields.date')} type="date" value={editing.holidayDate} onChange={(e) => setEditing({ ...editing, holidayDate: e.target.value })} required />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={editing.recurringYearly} onChange={(e) => setEditing({ ...editing, recurringYearly: e.target.checked })} />
              {t('fields.recurringYearly')}
            </label>
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
