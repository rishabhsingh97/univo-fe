import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salaryComponentApi } from '../api/payroll/salaryComponentApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Modal, PageHeader, PagedDataTable, SelectField, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { CalculationType, SalaryComponentRequest, SalaryComponentResponse, SalaryComponentType } from '../types/payroll';

const TYPES: SalaryComponentType[] = ['EARNING', 'DEDUCTION'];
const CALCULATION_TYPES: CalculationType[] = ['FLAT', 'PERCENTAGE_OF_BASIC'];

function emptyForm(): SalaryComponentRequest {
  return { name: '', code: '', type: 'EARNING', calculationType: 'FLAT', isBasic: false, taxable: true, active: true };
}

export function SalaryComponentsPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SalaryComponentRequest>(emptyForm());
  const [editing, setEditing] = useState<SalaryComponentResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const canWrite = hasPermission('payroll.salarycomponent.write');
  const canDelete = hasPermission('payroll.salarycomponent.delete');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['salary-components'] });

  const createMutation = useMutation({
    mutationFn: (request: SalaryComponentRequest) => salaryComponentApi.create(request),
    onSuccess: () => { invalidate(); setForm(emptyForm()); setShowCreate(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: SalaryComponentRequest }) => salaryComponentApi.update(id, request),
    onSuccess: () => { invalidate(); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => salaryComponentApi.delete(id),
    onSuccess: invalidate,
  });

  const columns: DataTableColumn<SalaryComponentResponse>[] = [
    { key: 'name', header: t('fields.name'), render: (c) => c.name, sortKey: 'name' },
    { key: 'code', header: t('fields.code'), render: (c) => c.code, sortKey: 'code' },
    { key: 'type', header: t('fields.type'), render: (c) => <Badge tone={c.type === 'EARNING' ? 'success' : 'danger'}>{c.type}</Badge> },
    { key: 'calc', header: t('fields.calculationType'), render: (c) => c.calculationType.replace(/_/g, ' ') },
    { key: 'basic', header: t('fields.isBasic'), render: (c) => (c.isBasic ? <Badge tone="success">{t('common.yes')}</Badge> : '-') },
    { key: 'taxable', header: t('fields.taxable'), render: (c) => (c.taxable ? t('common.yes') : t('common.no')) },
    { key: 'active', header: t('fields.status'), render: (c) => <Badge tone={c.active ? 'success' : 'neutral'}>{c.active ? t('common.active') : t('common.inactive')}</Badge> },
  ];

  const componentFields = (
    value: SalaryComponentRequest,
    onChange: (next: SalaryComponentRequest) => void,
  ) => (
    <>
      <TextField label={t('fields.name')} value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} required />
      <TextField label={t('fields.code')} value={value.code} onChange={(e) => onChange({ ...value, code: e.target.value })} required />
      <SelectField label={t('fields.type')} value={value.type} onChange={(e) => onChange({ ...value, type: e.target.value as SalaryComponentType })}>
        {TYPES.map((ty) => <option key={ty} value={ty}>{ty}</option>)}
      </SelectField>
      <SelectField label={t('fields.calculationType')} value={value.calculationType}
        onChange={(e) => onChange({ ...value, calculationType: e.target.value as CalculationType })}>
        {CALCULATION_TYPES.map((ct) => <option key={ct} value={ct}>{ct.replace(/_/g, ' ')}</option>)}
      </SelectField>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={value.isBasic} onChange={(e) => onChange({ ...value, isBasic: e.target.checked })} />
        {t('fields.isBasic')}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={value.taxable} onChange={(e) => onChange({ ...value, taxable: e.target.checked })} />
        {t('fields.taxable')}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={value.active} onChange={(e) => onChange({ ...value, active: e.target.checked })} />
        {t('fields.active')}
      </label>
    </>
  );

  return (
    <div>
      <PageHeader
        title={t('pages.salaryComponents.title')}
        description={t('pages.salaryComponents.description')}
        actions={canWrite ? <Button onClick={() => setShowCreate(true)}>{t('pages.salaryComponents.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.salaryComponents.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createMutation.mutate(form); }} className="form-grid">
            {componentFields(form, setForm)}
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
        queryKey={['salary-components']}
        fetchPage={salaryComponentApi.list}
        getRowKey={(c) => c.id}
        onEdit={canWrite ? (c) => setEditing(c) : undefined}
        onDelete={canDelete ? (c) => deleteMutation.mutate(c.id) : undefined}
      />

      {editing && (
        <Modal title={t('pages.salaryComponents.editTitle')} onClose={() => setEditing(null)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updateMutation.mutate({
                id: editing.id,
                request: {
                  name: editing.name,
                  code: editing.code,
                  type: editing.type,
                  calculationType: editing.calculationType,
                  isBasic: editing.isBasic,
                  taxable: editing.taxable,
                  active: editing.active,
                },
              });
            }}
            className="form-grid"
          >
            {componentFields(editing, (next) => setEditing({ ...editing, ...next }))}
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
