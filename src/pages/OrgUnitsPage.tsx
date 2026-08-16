import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orgUnitApi } from '../api/hr/orgUnitApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Button, DataTable, Modal, PageHeader, SelectField, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { OrgUnitRequest, OrgUnitResponse, OrgUnitType } from '../types/hr';

const ORG_UNIT_TYPES: OrgUnitType[] = ['COMPANY', 'BRANCH', 'DEPARTMENT'];

function emptyForm(): OrgUnitRequest {
  return { name: '', code: '', type: 'DEPARTMENT', parentId: null };
}

interface TreeRow {
  unit: OrgUnitResponse;
  depth: number;
}

/** Depth-first flatten so every child immediately follows its parent, in Company -&gt; Branch -&gt;
 * Department order - the whole reason the plain table was confusing with real hierarchical data
 * is that it had no sense of parent/child adjacency or nesting at all. */
function buildTree(units: OrgUnitResponse[]): TreeRow[] {
  const childrenByParent = new Map<number | null, OrgUnitResponse[]>();
  for (const unit of units) {
    const key = unit.parentId;
    const siblings = childrenByParent.get(key) ?? [];
    siblings.push(unit);
    childrenByParent.set(key, siblings);
  }
  for (const siblings of childrenByParent.values()) {
    siblings.sort((a, b) => a.name.localeCompare(b.name));
  }

  const rows: TreeRow[] = [];
  function visit(parentId: number | null, depth: number) {
    for (const unit of childrenByParent.get(parentId) ?? []) {
      rows.push({ unit, depth });
      visit(unit.id, depth + 1);
    }
  }
  visit(null, 0);

  // Anything whose parent isn't in this same result set (shouldn't normally happen) still needs
  // to show up somewhere rather than silently vanishing.
  const visited = new Set(rows.map((r) => r.unit.id));
  for (const unit of units) {
    if (!visited.has(unit.id)) rows.push({ unit, depth: 0 });
  }
  return rows;
}

export function OrgUnitsPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<OrgUnitRequest>(emptyForm());
  const [editing, setEditing] = useState<OrgUnitResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const canWrite = hasPermission('hr.orgunit.write');
  const canDelete = hasPermission('hr.orgunit.delete');

  // The whole tree, unpaginated - it's the shape of the data (a hierarchy), not a long list,
  // and pagination would slice it apart mid-branch.
  const { data: allOrgUnits, isLoading } = useQuery({ queryKey: ['org-units', 'select'], queryFn: () => orgUnitApi.list(0, 200) });
  const units = allOrgUnits?.content ?? [];
  const parentOptions = units;
  const treeRows = buildTree(units);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['org-units'] });

  const createMutation = useMutation({
    mutationFn: (request: OrgUnitRequest) => orgUnitApi.create(request),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm());
      setShowCreate(false);
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

  const columns: DataTableColumn<TreeRow>[] = [
    {
      key: 'name',
      header: t('fields.name'),
      render: ({ unit, depth }) => (
        <span style={{ paddingLeft: depth * 24, display: 'inline-block', fontWeight: unit.type === 'COMPANY' ? 700 : unit.type === 'BRANCH' ? 600 : 400 }}>
          {unit.name}
        </span>
      ),
    },
    { key: 'code', header: t('fields.code'), render: ({ unit }) => unit.code },
    { key: 'type', header: t('fields.type'), render: ({ unit }) => unit.type },
    {
      key: 'actions',
      header: t('common.actions'),
      render: ({ unit }) => (
        <div className="row-actions">
          {canWrite && <Button variant="secondary" onClick={() => setEditing(unit)}>{t('common.edit')}</Button>}
          {canDelete && (
            <Button variant="danger" onClick={() => window.confirm(t('common.confirmDelete')) && deleteMutation.mutate(unit.id)}>
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
        title={t('pages.orgUnits.title')}
        description={t('pages.orgUnits.description')}
        actions={canWrite ? <Button onClick={() => setShowCreate(true)}>{t('pages.orgUnits.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.orgUnits.createTitle')} onClose={() => setShowCreate(false)}>
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
              {parentOptions.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </SelectField>
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      <DataTable columns={columns} rows={treeRows} isLoading={isLoading} getRowKey={(r) => r.unit.id} maxHeight="70vh" />

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
              {parentOptions.filter((u) => u.id !== editing.id).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
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
