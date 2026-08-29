import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { goalApi } from '../api/hr/performanceApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useTimezone } from '../hooks/useTimezone';
import { Badge, Button, EmployeeSelect, Modal, PageHeader, PagedDataTable, SelectField, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { GoalRequest, GoalResponse, GoalStatus } from '../types/performance';

const GOAL_STATUSES: GoalStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'MISSED'];

function emptyGoal(): GoalRequest {
  return { employeeId: 0, title: '', description: '', dueDate: new Date().toISOString().slice(0, 10), status: 'NOT_STARTED', progressPercent: 0 };
}

export function GoalsPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const { formatDate } = useTimezone();
  const queryClient = useQueryClient();
  const canManage = hasPermission('performance.write');

  const [goalForm, setGoalForm] = useState<GoalRequest>(emptyGoal());
  const [showGoalCreate, setShowGoalCreate] = useState(false);

  const createGoal = useMutation({
    mutationFn: (request: GoalRequest) => goalApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setGoalForm(emptyGoal());
      setShowGoalCreate(false);
    },
  });

  const goalColumns: DataTableColumn<GoalResponse>[] = [
    { key: 'employee', header: t('common.selectEmployee'), render: (r) => r.employeeName, sortKey: 'employeeName' },
    { key: 'title', header: t('fields.goalTitle'), render: (r) => r.title, sortKey: 'title' },
    { key: 'dueDate', header: t('fields.dueDate'), render: (r) => formatDate(r.dueDate) },
    { key: 'progress', header: t('fields.progress'), render: (r) => `${r.progressPercent}%` },
    { key: 'status', header: t('fields.status'), render: (r) => <Badge tone={statusTone(r.status)}>{r.status.replace('_', ' ')}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.goals.title')}
        description={t('pages.goals.description')}
        actions={canManage && <Button onClick={() => setShowGoalCreate(true)}>{t('pages.goals.addGoal')}</Button>}
      />

      <PagedDataTable columns={goalColumns} queryKey={['goals']} fetchPage={goalApi.list} getRowKey={(r) => r.id} />

      {showGoalCreate && (
        <Modal title={t('pages.goals.createGoalTitle')} onClose={() => setShowGoalCreate(false)}>
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
    </div>
  );
}
