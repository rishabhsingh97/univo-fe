import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jobPostingApi } from '../api/recruitment/jobPostingApi';
import { jobRequisitionApi } from '../api/recruitment/jobRequisitionApi';
import { locationApi } from '../api/hr/locationApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Modal, PageHeader, PagedDataTable, SelectField, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { EmploymentType } from '../types/hr';
import type { JobPostingRequest, JobPostingResponse, JobPostingStatus } from '../types/recruitment';

const EMPLOYMENT_TYPES: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];
const STATUSES: JobPostingStatus[] = ['OPEN', 'CLOSED'];

function emptyForm(): JobPostingRequest {
  return { requisitionId: null, title: '', locationId: null, employmentType: 'FULL_TIME', description: '', status: 'OPEN' };
}

export function JobsPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<JobPostingRequest>(emptyForm());
  const [editing, setEditing] = useState<JobPostingResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const canWrite = hasPermission('recruitment.job.write');
  const canDelete = hasPermission('recruitment.job.delete');

  const { data: requisitions } = useQuery({ queryKey: ['job-requisitions', 'select'], queryFn: () => jobRequisitionApi.list(0, 200) });
  const { data: locations } = useQuery({ queryKey: ['locations', 'select'], queryFn: () => locationApi.list(0, 200) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['job-postings'] });

  const createMutation = useMutation({
    mutationFn: (request: JobPostingRequest) => jobPostingApi.create(request),
    onSuccess: () => { invalidate(); setForm(emptyForm()); setShowCreate(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: JobPostingRequest }) => jobPostingApi.update(id, request),
    onSuccess: () => { invalidate(); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => jobPostingApi.delete(id),
    onSuccess: invalidate,
  });

  const columns: DataTableColumn<JobPostingResponse>[] = [
    { key: 'title', header: t('fields.name'), render: (j) => j.title, sortKey: 'title' },
    { key: 'requisition', header: t('pages.jobRequisitions.title'), render: (j) => j.requisitionTitle ?? '-' },
    { key: 'location', header: t('fields.location'), render: (j) => j.locationName ?? '-' },
    { key: 'employmentType', header: t('fields.employmentType'), render: (j) => j.employmentType.replace('_', ' ') },
    { key: 'status', header: t('fields.status'), render: (j) => <Badge tone={statusTone(j.status)}>{j.status}</Badge> },
  ];

  const requisitionOptions = requisitions?.content ?? [];
  const locationOptions = locations?.content ?? [];

  const fields = (value: JobPostingRequest, onChange: (next: JobPostingRequest) => void) => (
    <>
      <TextField label={t('fields.name')} value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} required />
      <SelectField label={t('pages.jobRequisitions.title')} value={value.requisitionId ?? ''}
        onChange={(e) => onChange({ ...value, requisitionId: e.target.value ? Number(e.target.value) : null })}>
        <option value="">{t('common.none')}</option>
        {requisitionOptions.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
      </SelectField>
      <SelectField label={t('fields.location')} value={value.locationId ?? ''}
        onChange={(e) => onChange({ ...value, locationId: e.target.value ? Number(e.target.value) : null })}>
        <option value="">{t('common.none')}</option>
        {locationOptions.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
      </SelectField>
      <SelectField label={t('fields.employmentType')} value={value.employmentType ?? 'FULL_TIME'}
        onChange={(e) => onChange({ ...value, employmentType: e.target.value as EmploymentType })}>
        {EMPLOYMENT_TYPES.map((type) => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
      </SelectField>
      <SelectField label={t('fields.status')} value={value.status ?? 'OPEN'}
        onChange={(e) => onChange({ ...value, status: e.target.value as JobPostingStatus })}>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </SelectField>
      <TextField label={t('fields.description')} value={value.description ?? ''}
        onChange={(e) => onChange({ ...value, description: e.target.value })} />
    </>
  );

  return (
    <div>
      <PageHeader
        title={t('pages.jobs.title')}
        description={t('pages.jobs.description')}
        actions={canWrite ? <Button onClick={() => setShowCreate(true)}>{t('pages.jobs.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.jobs.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createMutation.mutate(form); }} className="form-grid">
            {fields(form, setForm)}
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
        queryKey={['job-postings']}
        fetchPage={jobPostingApi.list}
        getRowKey={(j) => j.id}
        onEdit={canWrite ? (j) => setEditing(j) : undefined}
        onDelete={canDelete ? (j) => deleteMutation.mutate(j.id) : undefined}
      />

      {editing && (
        <Modal title={t('pages.jobs.editTitle')} onClose={() => setEditing(null)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updateMutation.mutate({
                id: editing.id,
                request: {
                  requisitionId: editing.requisitionId,
                  title: editing.title,
                  locationId: editing.locationId,
                  employmentType: editing.employmentType,
                  description: editing.description,
                  status: editing.status,
                },
              });
            }}
            className="form-grid"
          >
            {fields(editing, (next) => setEditing({ ...editing, ...next } as JobPostingResponse))}
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
