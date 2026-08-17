import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appraisalApi, goalApi } from '../api/hr/performanceApi';
import { useLocale } from '../context/LocaleContext';
import { useTimezone } from '../hooks/useTimezone';
import { Badge, Button, Card, EmployeeSelect, Modal, PageHeader, PagedDataTable, SelectField, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { AppraisalRequest, AppraisalResponse, AppraisalStatus, GoalRequest, GoalResponse, GoalStatus } from '../types/performance';

const GOAL_STATUSES: GoalStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'MISSED'];
const APPRAISAL_STATUSES: AppraisalStatus[] = ['DRAFT', 'SUBMITTED', 'ACKNOWLEDGED'];

function emptyGoal(): GoalRequest {
  return { employeeId: 0, title: '', description: '', dueDate: new Date().toISOString().slice(0, 10), status: 'NOT_STARTED', progressPercent: 0 };
}

function emptyAppraisal(): AppraisalRequest {
  return { employeeId: 0, reviewCycle: '', rating: 3, reviewerComments: '', status: 'DRAFT' };
}

export function PerformancePage() {
  const { t } = useLocale();
  const { formatDate } = useTimezone();
  const queryClient = useQueryClient();
  // No real permission to gate on yet - Performance has no backend (see api/hr/performanceApi.ts).
  const canManage = true;

  const [goalForm, setGoalForm] = useState<GoalRequest>(emptyGoal());
  const [showGoalCreate, setShowGoalCreate] = useState(false);
  const [appraisalForm, setAppraisalForm] = useState<AppraisalRequest>(emptyAppraisal());
  const [showAppraisalCreate, setShowAppraisalCreate] = useState(false);

  const createGoal = useMutation({
    mutationFn: (request: GoalRequest) => goalApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setGoalForm(emptyGoal());
      setShowGoalCreate(false);
    },
  });

  const createAppraisal = useMutation({
    mutationFn: (request: AppraisalRequest) => appraisalApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appraisals'] });
      setAppraisalForm(emptyAppraisal());
      setShowAppraisalCreate(false);
    },
  });

  const goalColumns: DataTableColumn<GoalResponse>[] = [
    { key: 'employee', header: t('common.selectEmployee'), render: (r) => r.employeeName, sortKey: 'employeeName' },
    { key: 'title', header: t('fields.goalTitle'), render: (r) => r.title, sortKey: 'title' },
    { key: 'dueDate', header: t('fields.dueDate'), render: (r) => formatDate(r.dueDate) },
    { key: 'progress', header: t('fields.progress'), render: (r) => `${r.progressPercent}%` },
    { key: 'status', header: t('fields.status'), render: (r) => <Badge tone={statusTone(r.status)}>{r.status.replace('_', ' ')}</Badge> },
  ];

  const appraisalColumns: DataTableColumn<AppraisalResponse>[] = [
    { key: 'employee', header: t('common.selectEmployee'), render: (r) => r.employeeName, sortKey: 'employeeName' },
    { key: 'cycle', header: t('fields.reviewCycle'), render: (r) => r.reviewCycle, sortKey: 'reviewCycle' },
    { key: 'rating', header: t('fields.rating'), render: (r) => '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) },
    { key: 'status', header: t('fields.status'), render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader title={t('pages.performance.title')} description={t('pages.performance.description')} />

      <Card style={{ marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>{t('pages.performance.goalsTab')}</h2>
          {canManage && <Button onClick={() => setShowGoalCreate(true)}>{t('pages.performance.addGoal')}</Button>}
        </div>
        <PagedDataTable columns={goalColumns} queryKey={['goals']} fetchPage={goalApi.list} getRowKey={(r) => r.id} />
      </Card>

      <Card>
        <div className="page-header" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>{t('pages.performance.appraisalsTab')}</h2>
          {canManage && <Button onClick={() => setShowAppraisalCreate(true)}>{t('pages.performance.addAppraisal')}</Button>}
        </div>
        <PagedDataTable columns={appraisalColumns} queryKey={['appraisals']} fetchPage={appraisalApi.list} getRowKey={(r) => r.id} />
      </Card>

      {showGoalCreate && (
        <Modal title={t('pages.performance.createGoalTitle')} onClose={() => setShowGoalCreate(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createGoal.mutate(goalForm); }} className="form-grid">
            <EmployeeSelect value={goalForm.employeeId || ''} onChange={(id) => setGoalForm({ ...goalForm, employeeId: id })} required />
            <TextField label={t('fields.goalTitle')} value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} required />
            <TextField label={t('fields.description')} value={goalForm.description ?? ''} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} />
            <TextField label={t('fields.dueDate')} type="date" value={goalForm.dueDate} onChange={(e) => setGoalForm({ ...goalForm, dueDate: e.target.value })} required />
            <SelectField label={t('fields.status')} value={goalForm.status} onChange={(e) => setGoalForm({ ...goalForm, status: e.target.value as GoalStatus })}>
              {GOAL_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </SelectField>
            <TextField label={t('fields.progress')} type="number" min={0} max={100} value={goalForm.progressPercent} onChange={(e) => setGoalForm({ ...goalForm, progressPercent: Number(e.target.value) })} />
            <div className="form-actions">
              <Button type="submit" disabled={createGoal.isPending || !goalForm.employeeId}>
                {createGoal.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowGoalCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      {showAppraisalCreate && (
        <Modal title={t('pages.performance.createAppraisalTitle')} onClose={() => setShowAppraisalCreate(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createAppraisal.mutate(appraisalForm); }} className="form-grid">
            <EmployeeSelect value={appraisalForm.employeeId || ''} onChange={(id) => setAppraisalForm({ ...appraisalForm, employeeId: id })} required />
            <TextField label={t('fields.reviewCycle')} placeholder="H1 2026" value={appraisalForm.reviewCycle} onChange={(e) => setAppraisalForm({ ...appraisalForm, reviewCycle: e.target.value })} required />
            <SelectField label={t('fields.rating')} value={appraisalForm.rating} onChange={(e) => setAppraisalForm({ ...appraisalForm, rating: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </SelectField>
            <TextField label={t('fields.reviewerComments')} value={appraisalForm.reviewerComments ?? ''} onChange={(e) => setAppraisalForm({ ...appraisalForm, reviewerComments: e.target.value })} />
            <SelectField label={t('fields.status')} value={appraisalForm.status} onChange={(e) => setAppraisalForm({ ...appraisalForm, status: e.target.value as AppraisalStatus })}>
              {APPRAISAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </SelectField>
            <div className="form-actions">
              <Button type="submit" disabled={createAppraisal.isPending || !appraisalForm.employeeId}>
                {createAppraisal.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowAppraisalCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
