import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { locationApi } from '../api/hr/locationApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Button, Modal, PageHeader, PagedDataTable, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { LocationRequest, LocationResponse } from '../types/hr';

function emptyForm(): LocationRequest {
  return { name: '', code: '' };
}

export function LocationsPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<LocationRequest>(emptyForm());
  const [editing, setEditing] = useState<LocationResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const canWrite = hasPermission('hr.location.write');
  const canDelete = hasPermission('hr.location.delete');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['locations'] });

  const createMutation = useMutation({
    mutationFn: (request: LocationRequest) => locationApi.create(request),
    onSuccess: () => { invalidate(); setForm(emptyForm()); setShowCreate(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: LocationRequest }) => locationApi.update(id, request),
    onSuccess: () => { invalidate(); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => locationApi.delete(id),
    onSuccess: invalidate,
  });

  const columns: DataTableColumn<LocationResponse>[] = [
    { key: 'name', header: t('fields.name'), render: (l) => l.name, sortKey: 'name' },
    { key: 'code', header: t('fields.code'), render: (l) => l.code, sortKey: 'code' },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.locations.title')}
        description={t('pages.locations.description')}
        actions={canWrite ? <Button onClick={() => setShowCreate(true)}>{t('pages.locations.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.locations.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createMutation.mutate(form); }} className="form-grid">
            <TextField label={t('fields.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField label={t('fields.code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
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
        queryKey={['locations']}
        fetchPage={locationApi.list}
        getRowKey={(l) => l.id}
        onEdit={canWrite ? (l) => setEditing(l) : undefined}
        onDelete={canDelete ? (l) => deleteMutation.mutate(l.id) : undefined}
      />

      {editing && (
        <Modal title={t('pages.locations.editTitle')} onClose={() => setEditing(null)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updateMutation.mutate({ id: editing.id, request: { name: editing.name, code: editing.code } });
            }}
            className="form-grid"
          >
            <TextField label={t('fields.name')} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
            <TextField label={t('fields.code')} value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} required />
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
