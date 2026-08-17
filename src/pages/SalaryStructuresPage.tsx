import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { salaryStructureApi } from '../api/payroll/salaryStructureApi';
import { salaryComponentApi } from '../api/payroll/salaryComponentApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useTimezone } from '../hooks/useTimezone';
import { Button, EmployeeSelect, Modal, PageHeader, PagedDataTable, SelectField, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type {
  SalaryStructureComponentRequest,
  SalaryStructureRequest,
  SalaryStructureResponse,
} from '../types/payroll';

function emptyForm(): SalaryStructureRequest {
  return { employeeId: 0, effectiveFrom: new Date().toISOString().slice(0, 10), components: [] };
}

function ComponentLinesEditor({
  components,
  onChange,
}: {
  components: SalaryStructureComponentRequest[];
  onChange: (next: SalaryStructureComponentRequest[]) => void;
}) {
  const { t } = useLocale();
  const { data: availableComponents } = useQuery({
    queryKey: ['salary-components', 'select'],
    queryFn: () => salaryComponentApi.list(0, 100),
  });
  const active = availableComponents?.content.filter((c) => c.active) ?? [];

  const addLine = () => {
    const firstUnused = active.find((c) => !components.some((line) => line.componentId === c.id));
    if (!firstUnused) return;
    onChange([...components, { componentId: firstUnused.id, value: 0 }]);
  };

  const updateLine = (index: number, next: Partial<SalaryStructureComponentRequest>) => {
    onChange(components.map((line, i) => (i === index ? { ...line, ...next } : line)));
  };

  const removeLine = (index: number) => {
    onChange(components.filter((_, i) => i !== index));
  };

  return (
    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {components.length === 0 && <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{t('pages.salaryStructures.noComponents')}</p>}
      {components.map((line, index) => {
        const component = active.find((c) => c.id === line.componentId);
        return (
          <div key={index} className="row-actions" style={{ alignItems: 'flex-end' }}>
            <SelectField
              label={t('fields.name')}
              value={line.componentId || ''}
              onChange={(e) => updateLine(index, { componentId: Number(e.target.value) })}
            >
              {active.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
            </SelectField>
            <TextField
              label={component?.calculationType === 'PERCENTAGE_OF_BASIC' ? t('fields.percentage') : t('fields.amount')}
              type="number"
              min={0}
              step="0.01"
              value={line.value}
              onChange={(e) => updateLine(index, { value: Number(e.target.value) })}
            />
            <Button type="button" variant="danger" onClick={() => removeLine(index)}>{t('common.delete')}</Button>
          </div>
        );
      })}
      <Button type="button" variant="secondary" onClick={addLine} disabled={active.length === 0 || components.length >= active.length}>
        {t('pages.salaryStructures.addComponent')}
      </Button>
    </div>
  );
}

export function SalaryStructuresPage() {
  const { t } = useLocale();
  const { formatDate } = useTimezone();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<SalaryStructureRequest>(emptyForm());
  const [editing, setEditing] = useState<SalaryStructureResponse | null>(null);
  const [editingComponents, setEditingComponents] = useState<SalaryStructureComponentRequest[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const canWrite = hasPermission('payroll.salarystructure.write');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['salary-structures'] });

  const createMutation = useMutation({
    mutationFn: (request: SalaryStructureRequest) => salaryStructureApi.create(request),
    onSuccess: () => { invalidate(); setForm(emptyForm()); setShowCreate(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: SalaryStructureRequest }) => salaryStructureApi.update(id, request),
    onSuccess: () => { invalidate(); setEditing(null); },
  });

  const startEdit = (structure: SalaryStructureResponse) => {
    setEditing(structure);
    setEditingComponents(structure.components.map((c) => ({ componentId: c.componentId, value: c.value })));
  };

  const columns: DataTableColumn<SalaryStructureResponse>[] = [
    { key: 'employee', header: t('common.selectEmployee'), render: (s) => s.employeeName },
    {
      key: 'components',
      header: t('pages.salaryComponents.title'),
      render: (s) => s.components.map((c) => `${c.componentName}: ${c.resolvedAmount}`).join(', ') || '-',
    },
    { key: 'grossPay', header: t('fields.amount'), render: (s) => s.grossPay },
    { key: 'totalDeductions', header: t('pages.payroll.deductions'), render: (s) => s.totalDeductions },
    { key: 'netPay', header: t('pages.payroll.netPay'), render: (s) => s.netPay },
    { key: 'effectiveFrom', header: t('fields.effectiveFrom'), render: (s) => formatDate(s.effectiveFrom), sortKey: 'effectiveFrom' },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.salaryStructures.title')}
        description={t('pages.salaryStructures.description')}
        actions={canWrite ? <Button onClick={() => setShowCreate(true)}>{t('pages.salaryStructures.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.salaryStructures.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createMutation.mutate(form); }} className="form-grid">
            <EmployeeSelect value={form.employeeId || ''} onChange={(employeeId) => setForm({ ...form, employeeId })} required />
            <TextField label={t('fields.effectiveFrom')} type="date" value={form.effectiveFrom}
              onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} required />
            <ComponentLinesEditor components={form.components} onChange={(components) => setForm({ ...form, components })} />
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending || !form.employeeId || form.components.length === 0}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      <PagedDataTable
        columns={columns}
        queryKey={['salary-structures']}
        fetchPage={salaryStructureApi.list}
        getRowKey={(s) => s.id}
        onEdit={canWrite ? (s) => startEdit(s) : undefined}
      />

      {editing && (
        <Modal title={t('pages.salaryStructures.editTitle')} onClose={() => setEditing(null)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updateMutation.mutate({
                id: editing.id,
                request: { employeeId: editing.employeeId, effectiveFrom: editing.effectiveFrom, components: editingComponents },
              });
            }}
            className="form-grid"
          >
            <EmployeeSelect value={editing.employeeId} onChange={() => undefined} required />
            <TextField label={t('fields.effectiveFrom')} type="date" value={editing.effectiveFrom}
              onChange={(e) => setEditing({ ...editing, effectiveFrom: e.target.value })} required />
            <ComponentLinesEditor components={editingComponents} onChange={setEditingComponents} />
            <div className="form-actions">
              <Button type="submit" disabled={updateMutation.isPending || editingComponents.length === 0}>
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
