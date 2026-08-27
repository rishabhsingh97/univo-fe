import { useState, type FormEvent } from 'react';
import { useLocale } from '../context/LocaleContext';
import { Badge, Button, DataTable, Modal, PageHeader, SelectField, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';

type ServiceCategory = 'IT' | 'HR' | 'Facilities' | 'Payroll' | 'Other';
type ServicePriority = 'LOW' | 'MEDIUM' | 'HIGH';
type ServiceStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface ServiceRequestNote {
  id: number;
  author: string;
  note: string;
  date: string;
}

interface ServiceRequest {
  id: number;
  subject: string;
  category: ServiceCategory;
  description: string;
  priority: ServicePriority;
  status: ServiceStatus;
  raisedByName: string;
  raisedOn: string;
  notes: ServiceRequestNote[];
}

const CATEGORIES: ServiceCategory[] = ['IT', 'HR', 'Facilities', 'Payroll', 'Other'];
const PRIORITIES: ServicePriority[] = ['LOW', 'MEDIUM', 'HIGH'];
const STATUS_FLOW: Record<ServiceStatus, ServiceStatus | null> = { OPEN: 'IN_PROGRESS', IN_PROGRESS: 'RESOLVED', RESOLVED: 'CLOSED', CLOSED: null };

function seedRequests(): ServiceRequest[] {
  return [
    { id: 1, subject: 'Laptop running slow', category: 'IT', description: 'Laptop takes long to boot up.', priority: 'MEDIUM', status: 'OPEN', raisedByName: 'You', raisedOn: '2026-08-20', notes: [] },
    { id: 2, subject: 'Payslip discrepancy', category: 'Payroll', description: 'HRA missing from last month payslip.', priority: 'HIGH', status: 'IN_PROGRESS', raisedByName: 'You', raisedOn: '2026-08-18', notes: [{ id: 1, author: 'Payroll Team', note: 'Looking into it, will update by EOD.', date: '2026-08-19' }] },
  ];
}

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
  const [requests, setRequests] = useState<ServiceRequest[]>(seedRequests());
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'All'>('All');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<RequestForm>(emptyForm());
  const [viewing, setViewing] = useState<ServiceRequest | null>(null);
  const [newNote, setNewNote] = useState('');

  const filtered = statusFilter === 'All' ? requests : requests.filter((r) => r.status === statusFilter);

  const closeCreate = () => {
    setShowCreate(false);
    setForm(emptyForm());
  };

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    setRequests((prev) => [
      { id: Date.now(), subject: form.subject, category: form.category, description: form.description, priority: form.priority, status: 'OPEN', raisedByName: 'You', raisedOn: new Date().toISOString().slice(0, 10), notes: [] },
      ...prev,
    ]);
    closeCreate();
  };

  const setStatus = (id: number, status: ServiceStatus) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setViewing((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
  };

  const addNote = (id: number) => {
    if (!newNote.trim()) return;
    const note: ServiceRequestNote = { id: Date.now(), author: 'You', note: newNote.trim(), date: new Date().toISOString().slice(0, 10) };
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, notes: [...r.notes, note] } : r)));
    setViewing((prev) => (prev && prev.id === id ? { ...prev, notes: [...prev.notes, note] } : prev));
    setNewNote('');
  };

  const columns: DataTableColumn<ServiceRequest>[] = [
    { key: 'subject', header: t('fields.reason'), render: (r) => r.subject },
    { key: 'category', header: t('pages.services.category'), render: (r) => r.category },
    { key: 'priority', header: t('pages.tasks.priority'), render: (r) => r.priority },
    { key: 'raisedOn', header: t('pages.services.raisedOn'), render: (r) => r.raisedOn },
    { key: 'status', header: t('fields.status'), render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.services.title')}
        description={t('pages.services.description')}
        actions={<Button onClick={() => setShowCreate(true)}>{t('pages.services.addButton')}</Button>}
      />

      <div className="row-actions" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Button variant={statusFilter === 'All' ? 'primary' : 'secondary'} onClick={() => setStatusFilter('All')}>{t('common.all')}</Button>
        {(Object.keys(STATUS_FLOW) as ServiceStatus[]).map((s) => (
          <Button key={s} variant={statusFilter === s ? 'primary' : 'secondary'} onClick={() => setStatusFilter(s)}>{s}</Button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={(r) => r.id}
        onView={(r) => setViewing(r)}
        extraActions={(r) => {
          const next = STATUS_FLOW[r.status];
          return next ? [{ label: `${t('pages.tasks.moveTo')} ${next}`, onClick: () => setStatus(r.id, next) }] : [];
        }}
      />
      <p className="field-hint" style={{ marginTop: 12 }}>{t('pages.services.mockNotice')}</p>

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
            <span className="field-hint" style={{ gridColumn: '1 / -1' }}>{t('pages.services.mockNotice')}</span>
            <div className="form-actions">
              <Button type="submit">{t('common.create')}</Button>
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
              <div className="field-hint">{n.author} - {n.date}</div>
              <div>{n.note}</div>
            </div>
          ))}
          <div className="row-actions">
            <TextField label={t('pages.services.addNote')} value={newNote} onChange={(e) => setNewNote(e.target.value)} />
            <Button type="button" variant="secondary" onClick={() => addNote(viewing.id)}>{t('pages.addCandidate.addRow')}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
