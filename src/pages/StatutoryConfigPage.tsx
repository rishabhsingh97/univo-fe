import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { statutoryConfigApi } from '../api/finance/statutoryConfigApi';
import { taxSlabApi } from '../api/finance/taxSlabApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Modal, PageHeader, PagedDataTable, SelectField, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type {
  IncomeTaxSlabRequest,
  IncomeTaxSlabResponse,
  ProfessionalTaxSlabRequest,
  ProfessionalTaxSlabResponse,
  StatutoryConfigRequest,
  StatutoryConfigResponse,
  TaxRegime,
} from '../types/finance';

const REGIMES: TaxRegime[] = ['NEW', 'OLD'];

function toRequest(config: StatutoryConfigResponse): StatutoryConfigRequest {
  const { id: _id, ...request } = config;
  return request;
}

function emptyPtForm(): ProfessionalTaxSlabRequest {
  return { state: '', minGrossMonthly: 0, maxGrossMonthly: undefined, monthlyAmount: 0 };
}

function emptyItForm(): IncomeTaxSlabRequest {
  return { financialYear: '', regime: 'NEW', minAnnualIncome: 0, maxAnnualIncome: undefined, ratePercent: 0 };
}

export function StatutoryConfigPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const canWriteConfig = hasPermission('finance.statutoryconfig.write');
  const canWriteSlabs = hasPermission('finance.taxslabs.write');

  const { data: config } = useQuery({ queryKey: ['statutory-config'], queryFn: statutoryConfigApi.get });
  const [draft, setDraft] = useState<StatutoryConfigRequest | null>(null);

  useEffect(() => {
    if (config) setDraft(toRequest(config));
  }, [config]);

  const saveConfigMutation = useMutation({
    mutationFn: (request: StatutoryConfigRequest) => statutoryConfigApi.update(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['statutory-config'] }),
  });

  // Professional tax slabs
  const [showCreatePt, setShowCreatePt] = useState(false);
  const [ptForm, setPtForm] = useState<ProfessionalTaxSlabRequest>(emptyPtForm());
  const [editingPt, setEditingPt] = useState<ProfessionalTaxSlabResponse | null>(null);
  const invalidatePt = () => queryClient.invalidateQueries({ queryKey: ['pt-slabs'] });
  const createPtMutation = useMutation({
    mutationFn: (request: ProfessionalTaxSlabRequest) => taxSlabApi.createProfessionalTax(request),
    onSuccess: () => { invalidatePt(); setPtForm(emptyPtForm()); setShowCreatePt(false); },
  });
  const updatePtMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: ProfessionalTaxSlabRequest }) => taxSlabApi.updateProfessionalTax(id, request),
    onSuccess: () => { invalidatePt(); setEditingPt(null); },
  });
  const deletePtMutation = useMutation({
    mutationFn: (id: number) => taxSlabApi.deleteProfessionalTax(id),
    onSuccess: invalidatePt,
  });

  // Income tax slabs
  const [showCreateIt, setShowCreateIt] = useState(false);
  const [itForm, setItForm] = useState<IncomeTaxSlabRequest>(emptyItForm());
  const [editingIt, setEditingIt] = useState<IncomeTaxSlabResponse | null>(null);
  const invalidateIt = () => queryClient.invalidateQueries({ queryKey: ['it-slabs'] });
  const createItMutation = useMutation({
    mutationFn: (request: IncomeTaxSlabRequest) => taxSlabApi.createIncomeTax(request),
    onSuccess: () => { invalidateIt(); setItForm(emptyItForm()); setShowCreateIt(false); },
  });
  const updateItMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: IncomeTaxSlabRequest }) => taxSlabApi.updateIncomeTax(id, request),
    onSuccess: () => { invalidateIt(); setEditingIt(null); },
  });
  const deleteItMutation = useMutation({
    mutationFn: (id: number) => taxSlabApi.deleteIncomeTax(id),
    onSuccess: invalidateIt,
  });

  const ptColumns: DataTableColumn<ProfessionalTaxSlabResponse>[] = [
    { key: 'state', header: t('fields.state'), render: (s) => s.state, sortKey: 'state' },
    { key: 'min', header: t('fields.minGrossMonthly'), render: (s) => s.minGrossMonthly.toLocaleString('en-IN') },
    { key: 'max', header: t('fields.maxGrossMonthly'), render: (s) => s.maxGrossMonthly?.toLocaleString('en-IN') ?? '-' },
    { key: 'amount', header: t('fields.monthlyAmount'), render: (s) => s.monthlyAmount.toLocaleString('en-IN') },
  ];

  const itColumns: DataTableColumn<IncomeTaxSlabResponse>[] = [
    { key: 'fy', header: t('fields.financialYear'), render: (s) => s.financialYear, sortKey: 'financialYear' },
    { key: 'regime', header: t('fields.regime'), render: (s) => s.regime },
    { key: 'min', header: t('fields.minAnnualIncome'), render: (s) => s.minAnnualIncome.toLocaleString('en-IN') },
    { key: 'max', header: t('fields.maxAnnualIncome'), render: (s) => s.maxAnnualIncome?.toLocaleString('en-IN') ?? '-' },
    { key: 'rate', header: t('fields.ratePercent'), render: (s) => `${s.ratePercent}%` },
  ];

  const ptFields = (value: ProfessionalTaxSlabRequest, onChange: (next: ProfessionalTaxSlabRequest) => void) => (
    <>
      <TextField label={t('fields.state')} value={value.state} onChange={(e) => onChange({ ...value, state: e.target.value.toUpperCase() })} required />
      <TextField label={t('fields.minGrossMonthly')} type="number" value={value.minGrossMonthly} onChange={(e) => onChange({ ...value, minGrossMonthly: Number(e.target.value) })} required />
      <TextField label={t('fields.maxGrossMonthly')} type="number" value={value.maxGrossMonthly ?? ''} onChange={(e) => onChange({ ...value, maxGrossMonthly: e.target.value === '' ? undefined : Number(e.target.value) })} />
      <TextField label={t('fields.monthlyAmount')} type="number" value={value.monthlyAmount} onChange={(e) => onChange({ ...value, monthlyAmount: Number(e.target.value) })} required />
    </>
  );

  const itFields = (value: IncomeTaxSlabRequest, onChange: (next: IncomeTaxSlabRequest) => void) => (
    <>
      <TextField label={t('fields.financialYear')} placeholder="2026-27" value={value.financialYear} onChange={(e) => onChange({ ...value, financialYear: e.target.value })} required />
      <SelectField label={t('fields.regime')} value={value.regime} onChange={(e) => onChange({ ...value, regime: e.target.value as TaxRegime })}>
        {REGIMES.map((r) => <option key={r} value={r}>{r}</option>)}
      </SelectField>
      <TextField label={t('fields.minAnnualIncome')} type="number" value={value.minAnnualIncome} onChange={(e) => onChange({ ...value, minAnnualIncome: Number(e.target.value) })} required />
      <TextField label={t('fields.maxAnnualIncome')} type="number" value={value.maxAnnualIncome ?? ''} onChange={(e) => onChange({ ...value, maxAnnualIncome: e.target.value === '' ? undefined : Number(e.target.value) })} />
      <TextField label={t('fields.ratePercent')} type="number" step="0.01" value={value.ratePercent} onChange={(e) => onChange({ ...value, ratePercent: Number(e.target.value) })} required />
    </>
  );

  return (
    <div>
      <PageHeader title={t('pages.statutoryConfig.title')} description={t('pages.statutoryConfig.description')} />

      {draft && (
        <Card>
          <h3>{t('pages.statutoryConfig.settingsTitle')}</h3>
          <form
            onSubmit={(event: FormEvent) => { event.preventDefault(); saveConfigMutation.mutate(draft); }}
            className="form-grid"
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={draft.pfEnabled} onChange={(e) => setDraft({ ...draft, pfEnabled: e.target.checked })} disabled={!canWriteConfig} />
              {t('fields.pfEnabled')}
            </label>
            <TextField label={t('fields.pfEmployeeRatePercent')} type="number" step="0.01" value={draft.pfEmployeeRatePercent} onChange={(e) => setDraft({ ...draft, pfEmployeeRatePercent: Number(e.target.value) })} disabled={!canWriteConfig} />
            <TextField label={t('fields.pfEmployerRatePercent')} type="number" step="0.01" value={draft.pfEmployerRatePercent} onChange={(e) => setDraft({ ...draft, pfEmployerRatePercent: Number(e.target.value) })} disabled={!canWriteConfig} />
            <TextField label={t('fields.pfWageCeiling')} type="number" value={draft.pfWageCeiling} onChange={(e) => setDraft({ ...draft, pfWageCeiling: Number(e.target.value) })} disabled={!canWriteConfig} />

            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={draft.esiEnabled} onChange={(e) => setDraft({ ...draft, esiEnabled: e.target.checked })} disabled={!canWriteConfig} />
              {t('fields.esiEnabled')}
            </label>
            <TextField label={t('fields.esiEmployeeRatePercent')} type="number" step="0.01" value={draft.esiEmployeeRatePercent} onChange={(e) => setDraft({ ...draft, esiEmployeeRatePercent: Number(e.target.value) })} disabled={!canWriteConfig} />
            <TextField label={t('fields.esiEmployerRatePercent')} type="number" step="0.01" value={draft.esiEmployerRatePercent} onChange={(e) => setDraft({ ...draft, esiEmployerRatePercent: Number(e.target.value) })} disabled={!canWriteConfig} />
            <TextField label={t('fields.esiWageThreshold')} type="number" value={draft.esiWageThreshold} onChange={(e) => setDraft({ ...draft, esiWageThreshold: Number(e.target.value) })} disabled={!canWriteConfig} />

            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={draft.ptEnabled} onChange={(e) => setDraft({ ...draft, ptEnabled: e.target.checked })} disabled={!canWriteConfig} />
              {t('fields.ptEnabled')}
            </label>
            <TextField label={t('fields.ptState')} value={draft.ptState ?? ''} onChange={(e) => setDraft({ ...draft, ptState: e.target.value.toUpperCase() })} disabled={!canWriteConfig} />

            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={draft.gratuityEnabled} onChange={(e) => setDraft({ ...draft, gratuityEnabled: e.target.checked })} disabled={!canWriteConfig} />
              {t('fields.gratuityEnabled')}
            </label>
            <TextField label={t('fields.gratuityDaysPerYear')} type="number" value={draft.gratuityDaysPerYear} onChange={(e) => setDraft({ ...draft, gratuityDaysPerYear: Number(e.target.value) })} disabled={!canWriteConfig} />

            {canWriteConfig && (
              <div className="form-actions">
                <Button type="submit" disabled={saveConfigMutation.isPending}>
                  {saveConfigMutation.isPending ? t('common.saving') : t('pages.statutoryConfig.saveSettings')}
                </Button>
              </div>
            )}
          </form>
        </Card>
      )}

      <PageHeader
        title={t('pages.statutoryConfig.ptSlabsTitle')}
        actions={canWriteSlabs ? <Button onClick={() => setShowCreatePt(true)}>{t('pages.statutoryConfig.addPtSlab')}</Button> : undefined}
      />
      <PagedDataTable
        columns={ptColumns}
        queryKey={['pt-slabs']}
        fetchPage={taxSlabApi.listProfessionalTax}
        getRowKey={(s) => s.id}
        onEdit={canWriteSlabs ? (s) => setEditingPt(s) : undefined}
        onDelete={canWriteSlabs ? (s) => deletePtMutation.mutate(s.id) : undefined}
      />

      {showCreatePt && (
        <Modal title={t('pages.statutoryConfig.addPtSlab')} onClose={() => setShowCreatePt(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createPtMutation.mutate(ptForm); }} className="form-grid">
            {ptFields(ptForm, setPtForm)}
            <div className="form-actions">
              <Button type="submit" disabled={createPtMutation.isPending}>{createPtMutation.isPending ? t('common.creating') : t('common.create')}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreatePt(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      {editingPt && (
        <Modal title={t('pages.statutoryConfig.editPtSlab')} onClose={() => setEditingPt(null)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updatePtMutation.mutate({ id: editingPt.id, request: editingPt });
            }}
            className="form-grid"
          >
            {ptFields(editingPt, (next) => setEditingPt({ ...editingPt, ...next }))}
            <div className="form-actions">
              <Button type="submit" disabled={updatePtMutation.isPending}>{updatePtMutation.isPending ? t('common.saving') : t('common.save')}</Button>
              <Button type="button" variant="secondary" onClick={() => setEditingPt(null)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      <PageHeader
        title={t('pages.statutoryConfig.itSlabsTitle')}
        actions={canWriteSlabs ? <Button onClick={() => setShowCreateIt(true)}>{t('pages.statutoryConfig.addItSlab')}</Button> : undefined}
      />
      <PagedDataTable
        columns={itColumns}
        queryKey={['it-slabs']}
        fetchPage={taxSlabApi.listIncomeTax}
        getRowKey={(s) => s.id}
        onEdit={canWriteSlabs ? (s) => setEditingIt(s) : undefined}
        onDelete={canWriteSlabs ? (s) => deleteItMutation.mutate(s.id) : undefined}
      />

      {showCreateIt && (
        <Modal title={t('pages.statutoryConfig.addItSlab')} onClose={() => setShowCreateIt(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createItMutation.mutate(itForm); }} className="form-grid">
            {itFields(itForm, setItForm)}
            <div className="form-actions">
              <Button type="submit" disabled={createItMutation.isPending}>{createItMutation.isPending ? t('common.creating') : t('common.create')}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreateIt(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      {editingIt && (
        <Modal title={t('pages.statutoryConfig.editItSlab')} onClose={() => setEditingIt(null)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updateItMutation.mutate({ id: editingIt.id, request: editingIt });
            }}
            className="form-grid"
          >
            {itFields(editingIt, (next) => setEditingIt({ ...editingIt, ...next }))}
            <div className="form-actions">
              <Button type="submit" disabled={updateItMutation.isPending}>{updateItMutation.isPending ? t('common.saving') : t('common.save')}</Button>
              <Button type="button" variant="secondary" onClick={() => setEditingIt(null)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
