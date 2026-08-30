import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceRequestApi } from '../api/hr/serviceRequestApi';
import { useLocale } from '../context/LocaleContext';
import { Badge, Button, Modal, PageHeader, PagedDataTable, SelectField, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type {
  ServiceCategory,
  ServicePriority,
  ServiceRequestRequest,
  ServiceRequestResponse,
  ServiceRequestStatus,
} from '../types/services';

const CATEGORIES: ServiceCategory[] = ['IT', 'HR', 'FACILITIES', 'PAYROLL', 'OTHER'];
const PRIORITIES: ServicePriority[] = ['LOW', 'MEDIUM', 'HIGH'];
const STATUS_FLOW: Record<ServiceRequestStatus, ServiceRequestStatus | null> = {
  OPEN: 'IN_PROGRESS',
  IN_PROGRESS: 'RESOLVED',
  RESOLVED: 'CLOSED',
  CLOSED: null,
};

interface RequestForm {
  subject: string;
  category: ServiceCategory;
  description: string;
  priority: ServicePriority;
}

function emptyForm(): RequestForm {
  return { subject: '', category: 'IT', description: '', priority: 'MEDIUM' };
}

export function ServicesPage() {
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<RequestForm>(emptyForm());
  const [viewing, setViewing] = useState<ServiceRequestResponse | null>(null);
  const [newNote, setNewNote] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['services'] });

  const closeCreate = () => {
    setShowCreate(false);
    setForm(emptyForm());
  };

  const createMutation = useMutation({
    mutationFn: (request: ServiceRequestRequest) => serviceRequestApi.create(request),
    onSuccess: () => { invalidate(); closeCreate(); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ServiceRequestStatus }) => serviceRequestApi.updateStatus(id, { status }),
    onSuccess: (updated) => {
      invalidate();
      setViewing((prev) => (prev && prev.id === updated.id ? updated : prev));
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => serviceRequestApi.addNote(id, { note }),
    onSuccess: (updated) => {
      invalidate();
      setViewing((prev) => (prev && prev.id === updated.id ? updated : prev));
      setNewNote('');
    },
  });

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate({
      subject: form.subject,
      category: form.category,
      description: form.description || undefined,
      priority: form.priority,
    });
  };

  const columns: DataTableColumn<ServiceRequestResponse>[] = [
    { key: 'subject', header: t('fields.reason'), render: (r) => r.subject },
    { key: 'category', header: t('pages.services.category'), render: (r) => r.category },
    { key: 'priority', header: t('pages.tasks.priority'), render: (r) => r.priority },
    { key: 'raisedOn', header: t('pages.services.raisedOn'), render: (r) => new Date(r.raisedOn).toLocaleDateString() },
    { key: 'status', header: t('fields.status'), render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.services.title')}
        description={t('pages.services.description')}
        actions={<Button onClick={() => setShowCreate(true)}>{t('pages.services.addButton')}</Button>}
      />

      <PagedDataTable
        columns={columns}
        queryKey={['services']}
        fetchPage={serviceRequestApi.list}
        getRowKey={(r) => r.id}
        onView={(r) => setViewing(r)}
        extraActions={(r) => {
          const next = STATUS_FLOW[r.status];
          return next ? [{ label: `${t('pages.tasks.moveTo')} ${next}`, onClick: () => statusMutation.mutate({ id: r.id, status: next }) }] : [];
        }}
      />

      {showCreate && (
        <Modal title={t('pages.services.addButton')} onClose={closeCreate}>
          <form onSubmit={handleCreate} className="form-grid">
            <SelectField label={t('pages.services.category')} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ServiceCategory })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectField>
            <SelectField label={t('pages.tasks.priority')} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as ServicePriority })}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </SelectField>
            <TextField label={t('fields.reason')} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">{t('fields.description')}</label>
              <textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={closeCreate}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      {viewing && (
        <Modal title={viewing.subject} onClose={() => setViewing(null)}>
          <p>{viewing.description || '-'}</p>
          <h3 className="form-section-title">{t('pages.services.notes')}</h3>
          {viewing.notes.map((n) => (
            <div key={n.id} style={{ marginBottom: 10 }}>
              <div className="field-hint">{n.authorName ?? '-'} - {new Date(n.createdAt).toLocaleDateString()}</div>
              <div>{n.note}</div>
            </div>
          ))}
          <div className="row-actions">
            <TextField label={t('pages.services.addNote')} value={newNote} onChange={(e) => setNewNote(e.target.value)} />
            <Button
              type="button"
              variant="secondary"
              disabled={!newNote.trim() || addNoteMutation.isPending}
              onClick={() => addNoteMutation.mutate({ id: viewing.id, note: newNote.trim() })}
            >
              {t('pages.addCandidate.addRow')}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
