import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orgUnitApi } from '../api/hr/orgUnitApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Button, Card, DataTable, Modal, PageHeader, SelectField, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { OrgUnitRequest, OrgUnitResponse, OrgUnitType } from '../types/hr';

const ORG_UNIT_TYPES: OrgUnitType[] = ['COMPANY', 'BRANCH', 'DEPARTMENT'];

function emptyForm(): OrgUnitRequest {
  return { name: '', code: '', type: 'DEPARTMENT', parentId: null };
}

export function OrgUnitsPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<OrgUnitRequest>(emptyForm());
  const [editing, setEditing] = useState<OrgUnitResponse | null>(null);

  const canWrite = hasPermission('hr.orgunit.write');
  const canDelete = hasPermission('hr.orgunit.delete');

  const { data, isLoading } = useQuery({ queryKey: ['org-units'], queryFn: () => orgUnitApi.list(0, 50) });
  const orgUnits = data?.content ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['org-units'] });

  const createMutation = useMutation({
    mutationFn: (request: OrgUnitRequest) => orgUnitApi.create(request),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm());
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: OrgUnitRequest }) => orgUnitApi.update(id, request),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => orgUnitApi.delete(id),
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
      request: { name: editing.name, code: editing.code, type: editing.type, parentId: editing.parentId },
    });
  };

  const columns: DataTableColumn<OrgUnitResponse>[] = [
    { key: 'code', header: t('fields.code'), render: (u) => u.code },
    { key: 'name', header: t('fields.name'), render: (u) => u.name },
    { key: 'type', header: t('fields.type'), render: (u) => u.type },
    { key: 'parent', header: t('fields.parent'), render: (u) => u.parentName ?? '-' },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (u) => (
        <div className="row-actions">
          {canWrite && <Button variant="secondary" onClick={() => setEditing(u)}>{t('common.edit')}</Button>}
          {canDelete && (
            <Button variant="danger" onClick={() => window.confirm(t('common.confirmDelete')) && deleteMutation.mutate(u.id)}>
              {t('common.delete')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('pages.orgUnits.title')} description={t('pages.orgUnits.description')} />

      {canWrite && (
        <Card style={{ marginBottom: 24 }}>
          <h2 style={{ marginTop: 0 }}>{t('pages.orgUnits.createTitle')}</h2>
          <form onSubmit={handleCreate} className="form-grid">
            <TextField label={t('fields.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField label={t('fields.code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            <SelectField label={t('fields.type')} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as OrgUnitType })}>
              {ORG_UNIT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </SelectField>
            <SelectField
              label={t('fields.parent')}
              value={form.parentId ?? ''}
              onChange={(e) => setForm({ ...form, parentId: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">{t('pages.orgUnits.noParent')}</option>
              {orgUnits.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </SelectField>
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <DataTable columns={columns} rows={orgUnits} isLoading={isLoading} getRowKey={(u) => u.id} />

      {editing && (
        <Modal title={t('pages.orgUnits.editTitle')} onClose={() => setEditing(null)}>
          <form onSubmit={handleUpdate} className="form-grid">
            <TextField label={t('fields.name')} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
            <TextField label={t('fields.code')} value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} required />
            <SelectField label={t('fields.type')} value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as OrgUnitType })}>
              {ORG_UNIT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </SelectField>
            <SelectField
              label={t('fields.parent')}
              value={editing.parentId ?? ''}
              onChange={(e) => setEditing({ ...editing, parentId: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">{t('pages.orgUnits.noParent')}</option>
              {orgUnits.filter((u) => u.id !== editing.id).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </SelectField>
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
