import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { employeeApi } from '../api/hr/employeeApi';
import { useLocale } from '../context/LocaleContext';
import { Badge, Button, DataTable, EmployeeSelect, Modal, PageHeader, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';

type ObjectiveStatus = 'ON_TRACK' | 'AT_RISK' | 'COMPLETED';

interface KeyResult {
  id: number;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
}

interface CheckIn {
  id: number;
  date: string;
  note: string;
}

interface Objective {
  id: number;
  title: string;
  description: string;
  ownerEmployeeId: number;
  ownerName: string;
  cycle: string;
  keyResults: KeyResult[];
  checkIns: CheckIn[];
  status: ObjectiveStatus;
}

function progressOf(objective: Objective): number {
  if (objective.keyResults.length === 0) return 0;
  const ratios = objective.keyResults.map((kr) => (kr.targetValue === 0 ? 0 : Math.min(1, kr.currentValue / kr.targetValue)));
  return Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100);
}

function seedObjectives(): Objective[] {
  return [
    {
      id: 1,
      title: 'Improve employee retention',
      description: 'Reduce voluntary attrition this quarter.',
      ownerEmployeeId: 0,
      ownerName: 'Ananya Rao',
      cycle: 'Q3 2026',
      keyResults: [
        { id: 1, title: 'Reduce attrition rate', targetValue: 8, currentValue: 5, unit: '%' },
        { id: 2, title: 'Complete stay interviews', targetValue: 20, currentValue: 12, unit: 'interviews' },
      ],
      checkIns: [{ id: 1, date: '2026-08-10', note: 'On track, stay interviews scheduled for all at-risk employees.' }],
      status: 'ON_TRACK',
    },
  ];
}

interface KeyResultDraft { id: number; title: string; targetValue: string; currentValue: string; unit: string; }
function emptyKeyResult(id: number): KeyResultDraft {
  return { id, title: '', targetValue: '', currentValue: '0', unit: '' };
}

interface ObjectiveForm {
  title: string;
  description: string;
  ownerEmployeeId: number | '';
  cycle: string;
  keyResults: KeyResultDraft[];
}

function emptyForm(): ObjectiveForm {
  return { title: '', description: '', ownerEmployeeId: '', cycle: '', keyResults: [emptyKeyResult(1)] };
}

export function OkrPage() {
  const { t } = useLocale();
  const { data: employees } = useQuery({ queryKey: ['employees', 'select'], queryFn: () => employeeApi.list(0, 200) });

  const [objectives, setObjectives] = useState<Objective[]>(seedObjectives());
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<ObjectiveForm>(emptyForm());
  const [viewing, setViewing] = useState<Objective | null>(null);
  const [newCheckIn, setNewCheckIn] = useState('');

  const closeCreate = () => {
    setShowCreate(false);
    setForm(emptyForm());
  };

  const addKeyResultRow = () => setForm((prev) => ({ ...prev, keyResults: [...prev.keyResults, emptyKeyResult(Date.now())] }));
  const removeKeyResultRow = (id: number) => setForm((prev) => ({ ...prev, keyResults: prev.keyResults.filter((kr) => kr.id !== id) }));
  const updateKeyResultRow = (id: number, patch: Partial<KeyResultDraft>) =>
    setForm((prev) => ({ ...prev, keyResults: prev.keyResults.map((kr) => (kr.id === id ? { ...kr, ...patch } : kr)) }));

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    const owner = employees?.content.find((e) => e.id === form.ownerEmployeeId);
    if (!owner) return;
    setObjectives((prev) => [
      {
        id: Date.now(),
        title: form.title,
        description: form.description,
        ownerEmployeeId: owner.id,
        ownerName: `${owner.firstName} ${owner.lastName}`,
        cycle: form.cycle,
        keyResults: form.keyResults
          .filter((kr) => kr.title.trim())
          .map((kr) => ({ id: kr.id, title: kr.title, targetValue: Number(kr.targetValue) || 0, currentValue: Number(kr.currentValue) || 0, unit: kr.unit })),
        checkIns: [],
        status: 'ON_TRACK',
      },
      ...prev,
    ]);
    closeCreate();
  };

  const updateKeyResultValue = (objectiveId: number, keyResultId: number, currentValue: number) => {
    setObjectives((prev) =>
      prev.map((o) => (o.id === objectiveId ? { ...o, keyResults: o.keyResults.map((kr) => (kr.id === keyResultId ? { ...kr, currentValue } : kr)) } : o)),
    );
    setViewing((prev) =>
      prev && prev.id === objectiveId ? { ...prev, keyResults: prev.keyResults.map((kr) => (kr.id === keyResultId ? { ...kr, currentValue } : kr)) } : prev,
    );
  };

  const addCheckIn = (objectiveId: number) => {
    if (!newCheckIn.trim()) return;
    const checkIn: CheckIn = { id: Date.now(), date: new Date().toISOString().slice(0, 10), note: newCheckIn.trim() };
    setObjectives((prev) => prev.map((o) => (o.id === objectiveId ? { ...o, checkIns: [...o.checkIns, checkIn] } : o)));
    setViewing((prev) => (prev && prev.id === objectiveId ? { ...prev, checkIns: [...prev.checkIns, checkIn] } : prev));
    setNewCheckIn('');
  };

  const markCompleted = (objectiveId: number) => {
    setObjectives((prev) => prev.map((o) => (o.id === objectiveId ? { ...o, status: 'COMPLETED' } : o)));
    setViewing((prev) => (prev && prev.id === objectiveId ? { ...prev, status: 'COMPLETED' } : prev));
  };

  const columns: DataTableColumn<Objective>[] = [
    { key: 'title', header: t('fields.title'), render: (o) => o.title },
    { key: 'owner', header: t('pages.okr.owner'), render: (o) => o.ownerName },
    { key: 'cycle', header: t('pages.okr.cycle'), render: (o) => o.cycle },
    { key: 'progress', header: t('pages.onboarding.progress'), render: (o) => `${progressOf(o)}%` },
    { key: 'status', header: t('fields.status'), render: (o) => <Badge tone={statusTone(o.status)}>{o.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.okr.title')}
        description={t('pages.okr.description')}
        actions={<Button onClick={() => setShowCreate(true)}>{t('pages.okr.addButton')}</Button>}
      />

      <DataTable
        columns={columns}
        rows={objectives}
        getRowKey={(o) => o.id}
        onView={(o) => setViewing(o)}
        onDelete={(o) => setObjectives((prev) => prev.filter((row) => row.id !== o.id))}
      />
      <p className="field-hint" style={{ marginTop: 12 }}>{t('pages.okr.mockNotice')}</p>

      {showCreate && (
        <Modal title={t('pages.okr.addButton')} onClose={closeCreate}>
          <form onSubmit={handleCreate} className="form-grid">
            <TextField label={t('fields.title')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <EmployeeSelect value={form.ownerEmployeeId} onChange={(id) => setForm({ ...form, ownerEmployeeId: id })} label={t('pages.okr.owner')} required />
            <TextField label={t('pages.okr.cycle')} placeholder="Q3 2026" value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value })} required />
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">{t('fields.description')}</label>
              <textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="address-block-header" style={{ gridColumn: '1 / -1' }}>
              <h3 className="form-section-title" style={{ margin: 0 }}>{t('pages.okr.keyResults')}</h3>
              <Button type="button" variant="secondary" onClick={addKeyResultRow}>{t('pages.addCandidate.addRow')}</Button>
            </div>
            {form.keyResults.map((kr, index) => (
              <div className="repeatable-row" key={kr.id}>
                <div className="repeatable-row-header">
                  <span>{t('pages.okr.keyResults')} {index + 1}</span>
                  {form.keyResults.length > 1 && (
                    <Button type="button" variant="danger" onClick={() => removeKeyResultRow(kr.id)}>{t('pages.addCandidate.removeRow')}</Button>
                  )}
                </div>
                <div className="repeatable-row-grid">
                  <TextField label={t('fields.title')} value={kr.title} onChange={(e) => updateKeyResultRow(kr.id, { title: e.target.value })} />
                  <TextField label={t('pages.okr.targetValue')} type="number" value={kr.targetValue} onChange={(e) => updateKeyResultRow(kr.id, { targetValue: e.target.value })} />
                  <TextField label={t('pages.okr.unit')} value={kr.unit} onChange={(e) => updateKeyResultRow(kr.id, { unit: e.target.value })} />
                </div>
              </div>
            ))}

            <span className="field-hint" style={{ gridColumn: '1 / -1' }}>{t('pages.okr.mockNotice')}</span>
            <div className="form-actions">
              <Button type="submit" disabled={!form.ownerEmployeeId}>{t('common.create')}</Button>
              <Button type="button" variant="secondary" onClick={closeCreate}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      {viewing && (
        <Modal title={viewing.title} onClose={() => setViewing(null)}>
          <p>{viewing.description || '-'}</p>
          <h3 className="form-section-title">{t('pages.okr.keyResults')}</h3>
          {viewing.keyResults.map((kr) => (
            <div key={kr.id} className="field" style={{ marginBottom: 12 }}>
              <label className="field-label">{kr.title} ({t('pages.okr.targetValue')}: {kr.targetValue} {kr.unit})</label>
              <input
                type="number"
                className="input"
                value={kr.currentValue}
                onChange={(e) => updateKeyResultValue(viewing.id, kr.id, Number(e.target.value))}
              />
            </div>
          ))}
          <h3 className="form-section-title">{t('pages.okr.checkIns')}</h3>
          {viewing.checkIns.map((c) => (
            <div key={c.id} style={{ marginBottom: 10 }}>
              <div className="field-hint">{c.date}</div>
              <div>{c.note}</div>
            </div>
          ))}
          <div className="row-actions">
            <TextField label={t('pages.okr.addCheckIn')} value={newCheckIn} onChange={(e) => setNewCheckIn(e.target.value)} />
            <Button type="button" variant="secondary" onClick={() => addCheckIn(viewing.id)}>{t('pages.addCandidate.addRow')}</Button>
          </div>
          {viewing.status !== 'COMPLETED' && (
            <div className="form-actions" style={{ marginTop: 12 }}>
              <Button type="button" onClick={() => markCompleted(viewing.id)}>{t('pages.okr.markCompleted')}</Button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
