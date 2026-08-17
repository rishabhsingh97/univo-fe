import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { offerApi } from '../api/recruitment/offerApi';
import { candidateApi } from '../api/recruitment/candidateApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useTimezone } from '../hooks/useTimezone';
import { Badge, Button, Modal, PageHeader, PagedDataTable, SelectField, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { OfferRequest, OfferResponse, OfferStatus } from '../types/recruitment';

const STATUSES: OfferStatus[] = ['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'WITHDRAWN'];

function emptyForm(): OfferRequest {
  const today = new Date().toISOString().slice(0, 10);
  return { candidateId: 0, offeredSalary: 0, joiningDate: today, expiryDate: null, status: 'DRAFT' };
}

export function OffersPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const { formatDate } = useTimezone();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<OfferRequest>(emptyForm());
  const [editing, setEditing] = useState<OfferResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const canWrite = hasPermission('recruitment.offer.write');
  const canDelete = hasPermission('recruitment.offer.delete');

  const { data: candidates } = useQuery({ queryKey: ['candidates', 'select'], queryFn: () => candidateApi.list(0, 200) });
  const candidateOptions = candidates?.content ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['offers'] });

  const createMutation = useMutation({
    mutationFn: (request: OfferRequest) => offerApi.create(request),
    onSuccess: () => { invalidate(); setForm(emptyForm()); setShowCreate(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: OfferRequest }) => offerApi.update(id, request),
    onSuccess: () => { invalidate(); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => offerApi.delete(id),
    onSuccess: invalidate,
  });

  const columns: DataTableColumn<OfferResponse>[] = [
    { key: 'candidate', header: t('pages.candidates.title'), render: (o) => o.candidateName },
    { key: 'salary', header: t('pages.offers.offeredSalary'), render: (o) => o.offeredSalary },
    { key: 'joiningDate', header: t('fields.dateOfJoining'), render: (o) => formatDate(o.joiningDate) },
    { key: 'expiryDate', header: t('pages.offers.expiryDate'), render: (o) => (o.expiryDate ? formatDate(o.expiryDate) : '-') },
    { key: 'status', header: t('fields.status'), render: (o) => <Badge tone={statusTone(o.status)}>{o.status}</Badge> },
  ];

  const fields = (value: OfferRequest, onChange: (next: OfferRequest) => void) => (
    <>
      <SelectField label={t('pages.candidates.title')} value={value.candidateId || ''}
        onChange={(e) => onChange({ ...value, candidateId: Number(e.target.value) })} required>
        <option value="">{t('common.selectOption')}</option>
        {candidateOptions.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
      </SelectField>
      <TextField label={t('pages.offers.offeredSalary')} type="number" min={0} step="0.01" value={value.offeredSalary}
        onChange={(e) => onChange({ ...value, offeredSalary: Number(e.target.value) })} required />
      <TextField label={t('fields.dateOfJoining')} type="date" value={value.joiningDate}
        onChange={(e) => onChange({ ...value, joiningDate: e.target.value })} required />
      <TextField label={t('pages.offers.expiryDate')} type="date" value={value.expiryDate ?? ''}
        onChange={(e) => onChange({ ...value, expiryDate: e.target.value || null })} />
      <SelectField label={t('fields.status')} value={value.status ?? 'DRAFT'}
        onChange={(e) => onChange({ ...value, status: e.target.value as OfferStatus })}>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </SelectField>
    </>
  );

  return (
    <div>
      <PageHeader
        title={t('pages.offers.title')}
        description={t('pages.offers.description')}
        actions={canWrite ? <Button onClick={() => setShowCreate(true)}>{t('pages.offers.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.offers.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createMutation.mutate(form); }} className="form-grid">
            {fields(form, setForm)}
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending || !form.candidateId}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      <PagedDataTable
        columns={columns}
        queryKey={['offers']}
        fetchPage={offerApi.list}
        getRowKey={(o) => o.id}
        onEdit={canWrite ? (o) => setEditing(o) : undefined}
        onDelete={canDelete ? (o) => deleteMutation.mutate(o.id) : undefined}
      />

      {editing && (
        <Modal title={t('pages.offers.editTitle')} onClose={() => setEditing(null)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updateMutation.mutate({
                id: editing.id,
                request: {
                  candidateId: editing.candidateId,
                  offeredSalary: editing.offeredSalary,
                  joiningDate: editing.joiningDate,
                  expiryDate: editing.expiryDate,
                  status: editing.status,
                },
              });
            }}
            className="form-grid"
          >
            {fields(
              {
                candidateId: editing.candidateId,
                offeredSalary: editing.offeredSalary,
                joiningDate: editing.joiningDate,
                expiryDate: editing.expiryDate,
                status: editing.status,
              },
              (next) => setEditing({ ...editing, ...next }),
            )}
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
