import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { interviewApi } from '../api/recruitment/interviewApi';
import { candidateApi } from '../api/recruitment/candidateApi';
import { employeeApi } from '../api/hr/employeeApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useTimezone } from '../hooks/useTimezone';
import { Badge, Button, Modal, PageHeader, PagedDataTable, SelectField, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { InterviewOutcome, InterviewRequest, InterviewResponse, InterviewStatus } from '../types/recruitment';

const STATUSES: InterviewStatus[] = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];
const OUTCOMES: InterviewOutcome[] = ['PENDING', 'PASS', 'FAIL'];

function toDateTimeLocal(iso: string): string {
  return iso.length >= 16 ? iso.slice(0, 16) : iso;
}

function emptyForm(): InterviewRequest {
  return {
    candidateId: 0,
    interviewerId: null,
    round: '',
    scheduledAt: new Date().toISOString().slice(0, 16),
    status: 'SCHEDULED',
    outcome: 'PENDING',
    feedback: '',
  };
}

export function InterviewsPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const { format } = useTimezone();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<InterviewRequest>(emptyForm());
  const [editing, setEditing] = useState<InterviewResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const canWrite = hasPermission('recruitment.interview.write');
  const canDelete = hasPermission('recruitment.interview.delete');

  const { data: candidates } = useQuery({ queryKey: ['candidates', 'select'], queryFn: () => candidateApi.list(0, 200) });
  const candidateOptions = candidates?.content ?? [];
  const { data: employees } = useQuery({ queryKey: ['employees', 'select'], queryFn: () => employeeApi.list(0, 200) });
  const employeeOptions = employees?.content ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['interviews'] });

  const createMutation = useMutation({
    mutationFn: (request: InterviewRequest) => interviewApi.create({ ...request, scheduledAt: new Date(request.scheduledAt).toISOString() }),
    onSuccess: () => { invalidate(); setForm(emptyForm()); setShowCreate(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: InterviewRequest }) =>
      interviewApi.update(id, { ...request, scheduledAt: new Date(request.scheduledAt).toISOString() }),
    onSuccess: () => { invalidate(); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => interviewApi.delete(id),
    onSuccess: invalidate,
  });

  const columns: DataTableColumn<InterviewResponse>[] = [
    { key: 'candidate', header: t('pages.candidates.title'), render: (i) => i.candidateName },
    { key: 'round', header: t('pages.interviews.round'), render: (i) => i.round },
    { key: 'interviewer', header: t('pages.interviews.interviewer'), render: (i) => i.interviewerName ?? '-' },
    { key: 'scheduledAt', header: t('pages.interviews.scheduledAt'), render: (i) => format(i.scheduledAt) },
    { key: 'status', header: t('fields.status'), render: (i) => <Badge tone={statusTone(i.status)}>{i.status}</Badge> },
    { key: 'outcome', header: t('pages.interviews.outcome'), render: (i) => <Badge tone={statusTone(i.outcome)}>{i.outcome}</Badge> },
  ];

  const fields = (value: InterviewRequest, onChange: (next: InterviewRequest) => void) => (
    <>
      <SelectField label={t('pages.candidates.title')} value={value.candidateId || ''}
        onChange={(e) => onChange({ ...value, candidateId: Number(e.target.value) })} required>
        <option value="">{t('common.selectOption')}</option>
        {candidateOptions.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
      </SelectField>
      <SelectField label={t('pages.interviews.interviewer')} value={value.interviewerId ?? ''}
        onChange={(e) => onChange({ ...value, interviewerId: e.target.value ? Number(e.target.value) : null })}>
        <option value="">{t('common.none')}</option>
        {employeeOptions.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
      </SelectField>
      <TextField label={t('pages.interviews.round')} value={value.round} onChange={(e) => onChange({ ...value, round: e.target.value })} required />
      <TextField label={t('pages.interviews.scheduledAt')} type="datetime-local" value={toDateTimeLocal(value.scheduledAt)}
        onChange={(e) => onChange({ ...value, scheduledAt: e.target.value })} required />
      <SelectField label={t('fields.status')} value={value.status ?? 'SCHEDULED'}
        onChange={(e) => onChange({ ...value, status: e.target.value as InterviewStatus })}>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </SelectField>
      <SelectField label={t('pages.interviews.outcome')} value={value.outcome ?? 'PENDING'}
        onChange={(e) => onChange({ ...value, outcome: e.target.value as InterviewOutcome })}>
        {OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
      </SelectField>
      <TextField label={t('pages.interviews.feedback')} value={value.feedback ?? ''} onChange={(e) => onChange({ ...value, feedback: e.target.value })} />
    </>
  );

  return (
    <div>
      <PageHeader
        title={t('pages.interviews.title')}
        description={t('pages.interviews.description')}
        actions={canWrite ? <Button onClick={() => setShowCreate(true)}>{t('pages.interviews.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.interviews.createTitle')} onClose={() => setShowCreate(false)}>
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
        queryKey={['interviews']}
        fetchPage={interviewApi.list}
        getRowKey={(i) => i.id}
        onEdit={canWrite ? (i) => setEditing(i) : undefined}
        onDelete={canDelete ? (i) => deleteMutation.mutate(i.id) : undefined}
      />

      {editing && (
        <Modal title={t('pages.interviews.editTitle')} onClose={() => setEditing(null)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updateMutation.mutate({
                id: editing.id,
                request: {
                  candidateId: editing.candidateId,
                  interviewerId: editing.interviewerId,
                  round: editing.round,
                  scheduledAt: editing.scheduledAt,
                  status: editing.status,
                  outcome: editing.outcome,
                  feedback: editing.feedback,
                },
              });
            }}
            className="form-grid"
          >
            {fields(
              {
                candidateId: editing.candidateId,
                interviewerId: editing.interviewerId,
                round: editing.round,
                scheduledAt: editing.scheduledAt,
                status: editing.status,
                outcome: editing.outcome,
                feedback: editing.feedback,
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
