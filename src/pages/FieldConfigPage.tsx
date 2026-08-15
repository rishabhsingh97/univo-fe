import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fieldConfigApi } from '../api/admin/fieldConfigApi';
import { useLocale } from '../context/LocaleContext';
import { Button, Card, DataTable, Modal, PageHeader, SelectField, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { UiFieldConfigRequest, UiFieldConfigResponse } from '../types/admin';

// A curated list of the entities the app already models - matches the module/*/entity classes
// backing these forms. Free-form entity names are still accepted by the API if a future module
// isn't listed here yet.
const ENTITIES = [
  'Employee',
  'OrgUnit',
  'AttendanceRecord',
  'Holiday',
  'LeaveApplication',
  'PayrollRun',
  'SalaryStructure',
  'LoanAdvance',
  'Reimbursement',
  'TaxConfig',
];

const FIELD_TYPES = ['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT'];

function emptyForm(entityName: string): UiFieldConfigRequest {
  return {
    entityName, fieldName: '', label: '', fieldType: 'TEXT', custom: true,
    enabled: true, required: false, readOnly: false, displayOrder: 0,
  };
}

export function FieldConfigPage() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [entityName, setEntityName] = useState(ENTITIES[0]);
  const [form, setForm] = useState<UiFieldConfigRequest>(() => emptyForm(ENTITIES[0]));
  const [editing, setEditing] = useState<UiFieldConfigResponse | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['field-config', entityName],
    queryFn: () => fieldConfigApi.listByEntity(entityName),
  });
  const configs = data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['field-config', entityName] });

  const createMutation = useMutation({
    mutationFn: (request: UiFieldConfigRequest) => fieldConfigApi.create(request),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm(entityName));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: UiFieldConfigRequest }) => fieldConfigApi.update(id, request),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fieldConfigApi.delete(id),
    onSuccess: invalidate,
  });

  const handleEntityChange = (value: string) => {
    setEntityName(value);
    setForm(emptyForm(value));
  };

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
        entityName: editing.entityName,
        fieldName: editing.fieldName,
        label: editing.label,
        fieldType: editing.fieldType,
        custom: editing.custom,
        enabled: editing.enabled,
        required: editing.required,
        readOnly: editing.readOnly,
        displayOrder: editing.displayOrder,
      },
    });
  };

  const columns: DataTableColumn<UiFieldConfigResponse>[] = [
    { key: 'fieldName', header: t('fields.fieldName'), render: (c) => c.fieldName },
    { key: 'label', header: t('fields.label'), render: (c) => c.label },
    { key: 'fieldType', header: t('fields.fieldType'), render: (c) => c.fieldType },
    { key: 'custom', header: t('fields.isCustom'), render: (c) => (c.custom ? '✓' : '-') },
    { key: 'enabled', header: t('fields.enabled'), render: (c) => (c.enabled ? '✓' : '-') },
    { key: 'required', header: t('fields.required'), render: (c) => (c.required ? '✓' : '-') },
    { key: 'readOnly', header: t('fields.readOnly'), render: (c) => (c.readOnly ? '✓' : '-') },
    { key: 'displayOrder', header: t('fields.displayOrder'), render: (c) => c.displayOrder },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (c) => (
        <div className="row-actions">
          <Button variant="secondary" onClick={() => setEditing(c)}>{t('common.edit')}</Button>
          <Button variant="danger" onClick={() => window.confirm(t('common.confirmDelete')) && deleteMutation.mutate(c.id)}>
            {t('common.delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('pages.fieldConfig.title')} description={t('pages.fieldConfig.description')} />

      <Card style={{ marginBottom: 24 }}>
        <SelectField label={t('pages.fieldConfig.entityFilter')} value={entityName} onChange={(e) => handleEntityChange(e.target.value)} style={{ minWidth: 240 }}>
          {ENTITIES.map((entity) => <option key={entity} value={entity}>{entity}</option>)}
        </SelectField>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>{t('pages.fieldConfig.createTitle')}</h2>
        <form onSubmit={handleCreate} className="form-grid">
          <TextField label={t('fields.fieldName')} value={form.fieldName} onChange={(e) => setForm({ ...form, fieldName: e.target.value })} required />
          <TextField label={t('fields.label')} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
          <SelectField label={t('fields.fieldType')} value={form.fieldType} onChange={(e) => setForm({ ...form, fieldType: e.target.value })}>
            {FIELD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </SelectField>
          <TextField
            label={t('fields.displayOrder')}
            type="number"
            value={form.displayOrder}
            onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
          />
          <label className="checkbox-option">
            <input type="checkbox" checked={form.custom} onChange={(e) => setForm({ ...form, custom: e.target.checked })} />
            {t('fields.isCustom')}
          </label>
          <label className="checkbox-option">
            <input type="checkbox" checked={form.enabled ?? true} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
            {t('fields.enabled')}
          </label>
          <label className="checkbox-option">
            <input type="checkbox" checked={form.required} onChange={(e) => setForm({ ...form, required: e.target.checked })} />
            {t('fields.required')}
          </label>
          <label className="checkbox-option">
            <input type="checkbox" checked={form.readOnly} onChange={(e) => setForm({ ...form, readOnly: e.target.checked })} />
            {t('fields.readOnly')}
          </label>
          <div className="form-actions">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t('common.creating') : t('common.create')}
            </Button>
          </div>
        </form>
      </Card>

      <DataTable columns={columns} rows={configs} isLoading={isLoading} getRowKey={(c) => c.id} />

      {editing && (
        <Modal title={t('pages.fieldConfig.editTitle')} onClose={() => setEditing(null)}>
          <form onSubmit={handleUpdate} className="form-grid">
            <TextField label={t('fields.fieldName')} value={editing.fieldName} onChange={(e) => setEditing({ ...editing, fieldName: e.target.value })} required />
            <TextField label={t('fields.label')} value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} required />
            <SelectField label={t('fields.fieldType')} value={editing.fieldType} onChange={(e) => setEditing({ ...editing, fieldType: e.target.value })}>
              {FIELD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </SelectField>
            <TextField
              label={t('fields.displayOrder')}
              type="number"
              value={editing.displayOrder}
              onChange={(e) => setEditing({ ...editing, displayOrder: Number(e.target.value) })}
            />
            <label className="checkbox-option">
              <input type="checkbox" checked={editing.custom} onChange={(e) => setEditing({ ...editing, custom: e.target.checked })} />
              {t('fields.isCustom')}
            </label>
            <label className="checkbox-option">
              <input type="checkbox" checked={editing.enabled} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} />
              {t('fields.enabled')}
            </label>
            <label className="checkbox-option">
              <input type="checkbox" checked={editing.required} onChange={(e) => setEditing({ ...editing, required: e.target.checked })} />
              {t('fields.required')}
            </label>
            <label className="checkbox-option">
              <input type="checkbox" checked={editing.readOnly} onChange={(e) => setEditing({ ...editing, readOnly: e.target.checked })} />
              {t('fields.readOnly')}
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
