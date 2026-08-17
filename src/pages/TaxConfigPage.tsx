import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taxConfigApi } from '../api/finance/taxConfigApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Button, Modal, PageHeader, PagedDataTable, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { TaxConfigRequest, TaxConfigResponse } from '../types/finance';

function emptyForm(): TaxConfigRequest {
  return { financialYear: '', flatTaxRatePercent: 0, standardDeduction: 0 };
}

export function TaxConfigPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TaxConfigRequest>(emptyForm());
  const [editing, setEditing] = useState<TaxConfigResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const canWrite = hasPermission('finance.taxconfig.write');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tax-config'] });

  const createMutation = useMutation({
    mutationFn: (request: TaxConfigRequest) => taxConfigApi.create(request),
    onSuccess: () => { invalidate(); setForm(emptyForm()); setShowCreate(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: TaxConfigRequest }) => taxConfigApi.update(id, request),
    onSuccess: () => { invalidate(); setEditing(null); },
  });

  const columns: DataTableColumn<TaxConfigResponse>[] = [
    { key: 'financialYear', header: t('fields.financialYear'), render: (c) => c.financialYear, sortKey: 'financialYear' },
    { key: 'rate', header: t('fields.flatTaxRatePercent'), render: (c) => `${c.flatTaxRatePercent}%` },
    { key: 'deduction', header: t('fields.standardDeduction'), render: (c) => c.standardDeduction.toLocaleString('en-IN') },
  ];

  const configFields = (value: TaxConfigRequest, onChange: (next: TaxConfigRequest) => void) => (
    <>
      <TextField
        label={t('fields.financialYear')}
        placeholder="2026-27"
        value={value.financialYear}
        onChange={(e) => onChange({ ...value, financialYear: e.target.value })}
        required
      />
      <TextField
        label={t('fields.flatTaxRatePercent')}
        type="number"
        step="0.01"
        value={value.flatTaxRatePercent}
        onChange={(e) => onChange({ ...value, flatTaxRatePercent: Number(e.target.value) })}
        required
      />
      <TextField
        label={t('fields.standardDeduction')}
        type="number"
        value={value.standardDeduction ?? 0}
        onChange={(e) => onChange({ ...value, standardDeduction: Number(e.target.value) })}
      />
    </>
  );

  return (
    <div>
      <PageHeader
        title={t('pages.taxConfig.title')}
        description={t('pages.taxConfig.description')}
        actions={canWrite ? <Button onClick={() => setShowCreate(true)}>{t('pages.taxConfig.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.taxConfig.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createMutation.mutate(form); }} className="form-grid">
            {configFields(form, setForm)}
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
        queryKey={['tax-config']}
        fetchPage={taxConfigApi.list}
        getRowKey={(c) => c.id}
        onEdit={canWrite ? (c) => setEditing(c) : undefined}
      />

      {editing && (
        <Modal title={t('pages.taxConfig.editTitle')} onClose={() => setEditing(null)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updateMutation.mutate({
                id: editing.id,
                request: {
                  financialYear: editing.financialYear,
                  flatTaxRatePercent: editing.flatTaxRatePercent,
                  standardDeduction: editing.standardDeduction,
                },
              });
            }}
            className="form-grid"
          >
            {configFields(editing, (next) => setEditing({ ...editing, ...next }))}
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
