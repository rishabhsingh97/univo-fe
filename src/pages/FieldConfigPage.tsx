import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fieldConfigApi } from '../api/admin/fieldConfigApi';
import { useLocale } from '../context/LocaleContext';
import { Button, Card, DataTable, Modal, PageHeader, SelectField, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { UiFieldConfigRequest, UiFieldConfigResponse } from '../types/admin';

// The real fields on each entity (matches the module/*/entity classes, excluding id/audit
// columns) - this is "every field available to configure", independent of whether a
// UiFieldConfig row already exists for it. A tenant can only relabel/hide/require fields that
// actually exist, so there is no "add a new field" flow here.
const KNOWN_FIELDS: Record<string, string[]> = {
  Employee: [
    'employeeCode', 'firstName', 'lastName', 'email', 'phone', 'orgUnit', 'designation', 'grade',
    'manager', 'employmentType', 'dateOfJoining', 'confirmationDate', 'status', 'pan', 'aadhaarMasked',
    'uan', 'esiNumber', 'emergencyContactName', 'emergencyContactPhone', 'bankAccountNumber', 'bankIfsc',
  ],
  OrgUnit: ['name', 'code', 'type', 'parent'],
  AttendanceRecord: ['employee', 'attendanceDate', 'status', 'remarks'],
  Holiday: ['name', 'holidayDate', 'recurringYearly'],
  LeaveApplication: ['employee', 'leaveType', 'startDate', 'endDate', 'reason', 'status'],
  PayrollRun: ['periodMonth', 'periodYear', 'status', 'runDate'],
  SalaryStructure: ['employee', 'basic', 'hra', 'allowances', 'effectiveFrom'],
  LoanAdvance: ['employee', 'amount', 'reason', 'status', 'requestedDate'],
  Reimbursement: ['employee', 'amount', 'category', 'description', 'status', 'submittedDate'],
  TaxConfig: ['financialYear', 'flatTaxRatePercent', 'standardDeduction'],
};

const ENTITIES = Object.keys(KNOWN_FIELDS);

const FIELD_TYPES = ['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT'];

/** "employeeCode" -> "Employee Code" - the default label shown for a field that has no
 * UiFieldConfig override yet. */
function defaultLabel(fieldName: string): string {
  const spaced = fieldName.replace(/([A-Z])/g, ' $1').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** id is null for a field that has no override row yet - saving it creates one instead of
 * updating. */
type DisplayFieldRow = Omit<UiFieldConfigResponse, 'id'> & { id: number | null };

function defaultRow(entityName: string, fieldName: string): DisplayFieldRow {
  return {
    id: null, entityName, fieldName, label: defaultLabel(fieldName), fieldType: 'TEXT',
    custom: false, enabled: true, required: false, readOnly: false, displayOrder: 0,
  };
}

function toRequest(row: DisplayFieldRow): UiFieldConfigRequest {
  return {
    entityName: row.entityName,
    fieldName: row.fieldName,
    label: row.label,
    fieldType: row.fieldType,
    custom: row.custom,
    enabled: row.enabled,
    required: row.required,
    readOnly: row.readOnly,
    displayOrder: row.displayOrder,
  };
}

export function FieldConfigPage() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [entityName, setEntityName] = useState(ENTITIES[0]);
  const [editing, setEditing] = useState<DisplayFieldRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['field-config', entityName],
    queryFn: () => fieldConfigApi.listByEntity(entityName),
  });

  const rows: DisplayFieldRow[] = KNOWN_FIELDS[entityName].map((fieldName) => {
    const existing = data?.find((c) => c.fieldName === fieldName);
    return existing ?? defaultRow(entityName, fieldName);
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['field-config', entityName] });

  const createMutation = useMutation({
    mutationFn: (request: UiFieldConfigRequest) => fieldConfigApi.create(request),
    onSuccess: () => {
      invalidate();
      setEditing(null);
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

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    if (editing.id === null) {
      createMutation.mutate(toRequest(editing));
    } else {
      updateMutation.mutate({ id: editing.id, request: toRequest(editing) });
    }
  };

  const columns: DataTableColumn<DisplayFieldRow>[] = [
    { key: 'fieldName', header: t('fields.fieldName'), render: (c) => c.fieldName },
    { key: 'label', header: t('fields.label'), render: (c) => c.label },
    { key: 'fieldType', header: t('fields.fieldType'), render: (c) => c.fieldType },
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
          {c.id !== null && (
            <Button
              variant="danger"
              onClick={() => window.confirm(t('pages.fieldConfig.confirmResetField')) && deleteMutation.mutate(c.id as number)}
            >
              {t('pages.fieldConfig.resetField')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('pages.fieldConfig.title')} description={t('pages.fieldConfig.description')} />

      <Card style={{ marginBottom: 24 }}>
        <SelectField
          label={t('pages.fieldConfig.entityFilter')}
          value={entityName}
          onChange={(e) => setEntityName(e.target.value)}
          style={{ minWidth: 240 }}
        >
          {ENTITIES.map((entity) => <option key={entity} value={entity}>{entity}</option>)}
        </SelectField>
      </Card>

      <DataTable columns={columns} rows={rows} isLoading={isLoading} getRowKey={(c) => c.fieldName} />

      {editing && (
        <Modal title={editing.fieldName} onClose={() => setEditing(null)}>
          <form onSubmit={handleSave} className="form-grid">
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
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t('common.saving') : t('common.save')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
