import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jobRequisitionApi } from '../api/recruitment/jobRequisitionApi';
import { orgUnitApi } from '../api/hr/orgUnitApi';
import { designationApi } from '../api/hr/designationApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Modal, PageHeader, PagedDataTable, SelectField, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { JobRequisitionRequest, JobRequisitionResponse, RequisitionStatus } from '../types/recruitment';

const STATUSES: RequisitionStatus[] = ['OPEN', 'ON_HOLD', 'CLOSED'];

function emptyForm(): JobRequisitionRequest {
  return { title: '', orgUnitId: null, designationId: null, openings: 1, status: 'OPEN', description: '' };
}

export function JobRequisitionsPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<JobRequisitionRequest>(emptyForm());
  const [editing, setEditing] = useState<JobRequisitionResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const canWrite = hasPermission('recruitment.requisition.write');
  const canDelete = hasPermission('recruitment.requisition.delete');

  const { data: orgUnits } = useQuery({ queryKey: ['org-units', 'select'], queryFn: () => orgUnitApi.list(0, 200) });
  const { data: designations } = useQuery({ queryKey: ['designations', 'select'], queryFn: () => designationApi.list(0, 200) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['job-requisitions'] });

  const createMutation = useMutation({
    mutationFn: (request: JobRequisitionRequest) => jobRequisitionApi.create(request),
    onSuccess: () => { invalidate(); setForm(emptyForm()); setShowCreate(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: JobRequisitionRequest }) => jobRequisitionApi.update(id, request),
    onSuccess: () => { invalidate(); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => jobRequisitionApi.delete(id),
    onSuccess: invalidate,
  });

  const columns: DataTableColumn<JobRequisitionResponse>[] = [
    { key: 'title', header: t('fields.name'), render: (r) => r.title, sortKey: 'title' },
    { key: 'org', header: t('fields.orgUnit'), render: (r) => r.orgUnitName ?? '-' },
    { key: 'designation', header: t('fields.designation'), render: (r) => r.designationTitle ?? '-' },
    { key: 'openings', header: t('pages.jobRequisitions.openings'), render: (r) => r.openings },
    {
      key: 'status',
      header: t('fields.status'),
      render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
    },
  ];

  const orgUnitOptions = orgUnits?.content ?? [];
  const designationOptions = designations?.content ?? [];

  const fields = (value: JobRequisitionRequest, onChange: (next: JobRequisitionRequest) => void) => (
    <>
      <TextField label={t('fields.name')} value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} required />
      <SelectField label={t('fields.orgUnit')} value={value.orgUnitId ?? ''}
        onChange={(e) => onChange({ ...value, orgUnitId: e.target.value ? Number(e.target.value) : null })}>
        <option value="">{t('common.none')}</option>
        {orgUnitOptions.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </SelectField>
      <SelectField label={t('fields.designation')} value={value.designationId ?? ''}
        onChange={(e) => onChange({ ...value, designationId: e.target.value ? Number(e.target.value) : null })}>
        <option value="">{t('common.none')}</option>
        {designationOptions.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
      </SelectField>
      <TextField label={t('pages.jobRequisitions.openings')} type="number" min={1} value={value.openings ?? 1}
        onChange={(e) => onChange({ ...value, openings: Number(e.target.value) })} />
      <SelectField label={t('fields.status')} value={value.status ?? 'OPEN'}
        onChange={(e) => onChange({ ...value, status: e.target.value as RequisitionStatus })}>
        {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
      </SelectField>
      <TextField label={t('fields.description')} value={value.description ?? ''}
        onChange={(e) => onChange({ ...value, description: e.target.value })} />
    </>
  );

  return (
    <div>
      <PageHeader
        title={t('pages.jobRequisitions.title')}
        description={t('pages.jobRequisitions.description')}
        actions={canWrite ? <Button onClick={() => setShowCreate(true)}>{t('pages.jobRequisitions.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.jobRequisitions.createTitle')} onClose={() => setShowCreate(false)}>
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
        queryKey={['job-requisitions']}
        fetchPage={jobRequisitionApi.list}
        getRowKey={(r) => r.id}
        onEdit={canWrite ? (r) => setEditing(r) : undefined}
        onDelete={canDelete ? (r) => deleteMutation.mutate(r.id) : undefined}
      />

      {editing && (
        <Modal title={t('pages.jobRequisitions.editTitle')} onClose={() => setEditing(null)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updateMutation.mutate({
                id: editing.id,
                request: {
                  title: editing.title,
                  orgUnitId: editing.orgUnitId,
                  designationId: editing.designationId,
                  openings: editing.openings,
                  status: editing.status,
                  description: editing.description,
                },
              });
            }}
            className="form-grid"
          >
            {fields(editing, (next) => setEditing({ ...editing, ...next } as JobRequisitionResponse))}
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
