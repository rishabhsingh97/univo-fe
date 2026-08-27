import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { candidateApi } from '../api/recruitment/candidateApi';
import { jobPostingApi } from '../api/recruitment/jobPostingApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Modal, PageHeader, PagedDataTable, SelectField, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { CandidateRequest, CandidateResponse, CandidateStatus } from '../types/recruitment';
import { CandidateDetailsFormFields, emptyCandidateExtras, type CandidateExtras } from '../components/CandidateDetailsForm';

const STATUSES: CandidateStatus[] = ['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED'];

function emptyForm(): CandidateRequest {
  return { jobPostingId: 0, firstName: '', lastName: '', email: '', phone: '', source: '', resumeUrl: '', status: 'APPLIED' };
}

export function CandidatesPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CandidateRequest>(emptyForm());
  const [extras, setExtras] = useState<CandidateExtras>(emptyCandidateExtras());
  const [editing, setEditing] = useState<CandidateResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const canWrite = hasPermission('recruitment.candidate.write');
  const canDelete = hasPermission('recruitment.candidate.delete');

  const { data: jobPostings } = useQuery({ queryKey: ['job-postings', 'select'], queryFn: () => jobPostingApi.list(0, 200) });
  const jobPostingOptions = jobPostings?.content ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['candidates'] });

  const closeCreate = () => {
    setShowCreate(false);
    setForm(emptyForm());
    setExtras(emptyCandidateExtras());
  };

  const createMutation = useMutation({
    mutationFn: (request: CandidateRequest) => candidateApi.create(request),
    onSuccess: () => { invalidate(); closeCreate(); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: CandidateRequest }) => candidateApi.update(id, request),
    onSuccess: () => { invalidate(); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => candidateApi.delete(id),
    onSuccess: invalidate,
  });

  const columns: DataTableColumn<CandidateResponse>[] = [
    {
      key: 'name',
      header: t('fields.name'),
      render: (c) => (
        <div className="table-cell-stack">
          <span>{c.firstName} {c.lastName}</span>
          <span className="table-cell-stack-secondary">{c.email}</span>
        </div>
      ),
    },
    { key: 'job', header: t('pages.jobs.title'), render: (c) => c.jobPostingTitle },
    { key: 'source', header: t('pages.candidates.source'), render: (c) => c.source ?? '-' },
    { key: 'status', header: t('fields.status'), render: (c) => <Badge tone={statusTone(c.status)}>{c.status}</Badge> },
  ];

  const fields = (value: CandidateRequest, onChange: (next: CandidateRequest) => void) => (
    <>
      <SelectField label={t('pages.jobs.title')} value={value.jobPostingId || ''}
        onChange={(e) => onChange({ ...value, jobPostingId: Number(e.target.value) })} required>
        <option value="">{t('common.selectOption')}</option>
        {jobPostingOptions.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
      </SelectField>
      <TextField label={t('fields.firstName')} value={value.firstName} onChange={(e) => onChange({ ...value, firstName: e.target.value })} required />
      <TextField label={t('fields.lastName')} value={value.lastName} onChange={(e) => onChange({ ...value, lastName: e.target.value })} required />
      <TextField label={t('fields.email')} type="email" value={value.email} onChange={(e) => onChange({ ...value, email: e.target.value })} required />
      <TextField label={t('fields.phone')} value={value.phone ?? ''} onChange={(e) => onChange({ ...value, phone: e.target.value })} />
      <TextField label={t('pages.candidates.source')} value={value.source ?? ''} onChange={(e) => onChange({ ...value, source: e.target.value })} />
      <TextField label={t('pages.candidates.resumeUrl')} value={value.resumeUrl ?? ''} onChange={(e) => onChange({ ...value, resumeUrl: e.target.value })} />
      <SelectField label={t('fields.status')} value={value.status ?? 'APPLIED'}
        onChange={(e) => onChange({ ...value, status: e.target.value as CandidateStatus })}>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </SelectField>
    </>
  );

  return (
    <div>
      <PageHeader
        title={t('pages.candidates.title')}
        description={t('pages.candidates.description')}
        actions={canWrite ? <Button onClick={() => setShowCreate(true)}>{t('pages.candidates.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.candidates.createTitle')} onClose={closeCreate}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createMutation.mutate(form); }} className="form-grid">
            {fields(form, setForm)}
            <CandidateDetailsFormFields value={extras} onChange={setExtras} />
            <span className="field-hint" style={{ gridColumn: '1 / -1' }}>{t('pages.addCandidate.mockNotice')}</span>
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending || !form.jobPostingId}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={closeCreate}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      <PagedDataTable
        columns={columns}
        queryKey={['candidates']}
        fetchPage={candidateApi.list}
        getRowKey={(c) => c.id}
        onEdit={canWrite ? (c) => setEditing(c) : undefined}
        onDelete={canDelete ? (c) => deleteMutation.mutate(c.id) : undefined}
      />

      {editing && (
        <Modal title={t('pages.candidates.editTitle')} onClose={() => setEditing(null)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updateMutation.mutate({
                id: editing.id,
                request: {
                  jobPostingId: editing.jobPostingId,
                  firstName: editing.firstName,
                  lastName: editing.lastName,
                  email: editing.email,
                  phone: editing.phone,
                  source: editing.source,
                  resumeUrl: editing.resumeUrl,
                  status: editing.status,
                },
              });
            }}
            className="form-grid"
          >
            {fields(editing, (next) => setEditing({ ...editing, ...next } as CandidateResponse))}
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
