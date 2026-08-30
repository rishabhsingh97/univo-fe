import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { locationApi } from '../api/hr/locationApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Modal, PageHeader, PagedDataTable, SelectField, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { LocationRequest, LocationResponse, LocationType } from '../types/hr';

const LOCATION_TYPES: LocationType[] = ['HEAD_OFFICE', 'BRANCH_OFFICE', 'WAREHOUSE', 'REMOTE', 'CLIENT_SITE'];

function emptyForm(): LocationRequest {
  return { name: '', code: '', description: '', locationType: undefined, address: '', city: '', state: '', country: '', pincode: '', active: true };
}

function toRequest(l: LocationResponse): LocationRequest {
  return {
    name: l.name,
    code: l.code,
    description: l.description ?? '',
    locationType: l.locationType ?? undefined,
    address: l.address ?? '',
    city: l.city ?? '',
    state: l.state ?? '',
    country: l.country ?? '',
    pincode: l.pincode ?? '',
    active: l.active,
  };
}

function LocationFormFields({ form, onChange }: { form: LocationRequest; onChange: (next: LocationRequest) => void }) {
  const { t } = useLocale();
  return (
    <>
      <TextField label={t('fields.name')} value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} required />
      <TextField label={t('fields.code')} value={form.code} onChange={(e) => onChange({ ...form, code: e.target.value })} required />
      <TextField label={t('fields.description')} value={form.description ?? ''} onChange={(e) => onChange({ ...form, description: e.target.value })} />
      <SelectField
        label={t('fields.locationType')}
        value={form.locationType ?? ''}
        onChange={(e) => onChange({ ...form, locationType: (e.target.value || undefined) as LocationType | undefined })}
      >
        <option value="">{t('common.selectOption')}</option>
        {LOCATION_TYPES.map((type) => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
      </SelectField>
      <TextField label={t('fields.address')} value={form.address ?? ''} onChange={(e) => onChange({ ...form, address: e.target.value })} />
      <TextField label={t('fields.city')} value={form.city ?? ''} onChange={(e) => onChange({ ...form, city: e.target.value })} />
      <TextField label={t('fields.state')} value={form.state ?? ''} onChange={(e) => onChange({ ...form, state: e.target.value })} />
      <TextField label={t('fields.country')} value={form.country ?? ''} onChange={(e) => onChange({ ...form, country: e.target.value })} />
      <TextField label={t('fields.pincode')} value={form.pincode ?? ''} onChange={(e) => onChange({ ...form, pincode: e.target.value })} />
      <label className="checkbox-option">
        <input type="checkbox" checked={form.active} onChange={(e) => onChange({ ...form, active: e.target.checked })} />
        {t('fields.active')}
      </label>
    </>
  );
}

export function LocationsPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<LocationRequest>(emptyForm());
  const [editing, setEditing] = useState<LocationResponse | null>(null);
  const [editForm, setEditForm] = useState<LocationRequest | null>(null);
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
    onSuccess: () => { invalidate(); setEditing(null); setEditForm(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => locationApi.delete(id),
    onSuccess: invalidate,
  });

  const openEdit = (l: LocationResponse) => {
    setEditing(l);
    setEditForm(toRequest(l));
  };

  const columns: DataTableColumn<LocationResponse>[] = [
    { key: 'name', header: t('fields.name'), render: (l) => l.name, sortKey: 'name' },
    { key: 'code', header: t('fields.code'), render: (l) => l.code, sortKey: 'code' },
    { key: 'type', header: t('fields.locationType'), render: (l) => l.locationType?.replace('_', ' ') ?? '-' },
    { key: 'city', header: t('fields.city'), render: (l) => [l.city, l.state, l.country].filter(Boolean).join(', ') || '-' },
    { key: 'active', header: t('fields.active'), render: (l) => <Badge tone={l.active ? 'success' : 'neutral'}>{l.active ? t('common.active') : t('common.inactive')}</Badge> },
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
            <LocationFormFields form={form} onChange={setForm} />
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
        onEdit={canWrite ? openEdit : undefined}
        onDelete={canDelete ? (l) => deleteMutation.mutate(l.id) : undefined}
      />

      {editing && editForm && (
        <Modal title={t('pages.locations.editTitle')} onClose={() => { setEditing(null); setEditForm(null); }}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updateMutation.mutate({ id: editing.id, request: editForm });
            }}
            className="form-grid"
          >
            <LocationFormFields form={editForm} onChange={setEditForm} />
            <div className="form-actions">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t('common.saving') : t('common.save')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setEditing(null); setEditForm(null); }}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
