import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salaryStructureApi } from '../api/payroll/salaryStructureApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useTimezone } from '../hooks/useTimezone';
import { Button, EmployeeSelect, Modal, PageHeader, PagedDataTable, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { SalaryStructureRequest, SalaryStructureResponse } from '../types/payroll';

function emptyForm(): SalaryStructureRequest {
  return { employeeId: 0, basic: 0, hra: 0, allowances: 0, effectiveFrom: new Date().toISOString().slice(0, 10) };
}

export function SalaryStructuresPage() {
  const { t } = useLocale();
  const { formatDate } = useTimezone();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<SalaryStructureRequest>(emptyForm());
  const [editing, setEditing] = useState<SalaryStructureResponse | null>(null);
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

  const columns: DataTableColumn<SalaryStructureResponse>[] = [
    { key: 'employee', header: t('common.selectEmployee'), render: (s) => s.employeeName },
    { key: 'basic', header: t('fields.basic'), render: (s) => s.basic },
    { key: 'hra', header: t('fields.hra'), render: (s) => s.hra },
    { key: 'allowances', header: t('fields.allowances'), render: (s) => s.allowances },
    { key: 'grossPay', header: t('fields.amount'), render: (s) => s.grossPay },
    { key: 'effectiveFrom', header: t('fields.effectiveFrom'), render: (s) => formatDate(s.effectiveFrom), sortKey: 'effectiveFrom' },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (s) => (canWrite ? <Button variant="secondary" onClick={() => setEditing(s)}>{t('common.edit')}</Button> : null),
    },
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
            <TextField label={t('fields.basic')} type="number" min={0} step="0.01" value={form.basic}
              onChange={(e) => setForm({ ...form, basic: Number(e.target.value) })} required />
            <TextField label={t('fields.hra')} type="number" min={0} step="0.01" value={form.hra ?? 0}
              onChange={(e) => setForm({ ...form, hra: Number(e.target.value) })} />
            <TextField label={t('fields.allowances')} type="number" min={0} step="0.01" value={form.allowances ?? 0}
              onChange={(e) => setForm({ ...form, allowances: Number(e.target.value) })} />
            <TextField label={t('fields.effectiveFrom')} type="date" value={form.effectiveFrom}
              onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} required />
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending || !form.employeeId}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      <PagedDataTable columns={columns} queryKey={['salary-structures']} fetchPage={salaryStructureApi.list} getRowKey={(s) => s.id} />

      {editing && (
        <Modal title={t('pages.salaryStructures.editTitle')} onClose={() => setEditing(null)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updateMutation.mutate({
                id: editing.id,
                request: {
                  employeeId: editing.employeeId,
                  basic: editing.basic,
                  hra: editing.hra,
                  allowances: editing.allowances,
                  effectiveFrom: editing.effectiveFrom,
                },
              });
            }}
            className="form-grid"
          >
            <EmployeeSelect value={editing.employeeId} onChange={(employeeId) => setEditing({ ...editing, employeeId })} required />
            <TextField label={t('fields.basic')} type="number" min={0} step="0.01" value={editing.basic}
              onChange={(e) => setEditing({ ...editing, basic: Number(e.target.value) })} required />
            <TextField label={t('fields.hra')} type="number" min={0} step="0.01" value={editing.hra}
              onChange={(e) => setEditing({ ...editing, hra: Number(e.target.value) })} />
            <TextField label={t('fields.allowances')} type="number" min={0} step="0.01" value={editing.allowances}
              onChange={(e) => setEditing({ ...editing, allowances: Number(e.target.value) })} />
            <TextField label={t('fields.effectiveFrom')} type="date" value={editing.effectiveFrom}
              onChange={(e) => setEditing({ ...editing, effectiveFrom: e.target.value })} required />
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
