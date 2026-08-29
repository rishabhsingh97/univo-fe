import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../api/hr/employeeApi';
import { designationApi } from '../api/hr/designationApi';
import { useLocale } from '../context/LocaleContext';
import { useFieldLabels } from '../hooks/useFieldLabels';
import { Badge, Button, DataTable, EmployeeSelect, Modal, PageHeader, SelectField, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { EmployeeRequest, EmployeeResponse, EmploymentType } from '../types/hr';

type OnboardingTaskCategory = 'Documentation' | 'Asset' | 'Policy' | 'Orientation' | 'Other';
type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

interface OnboardingTask {
  id: number;
  title: string;
  category: OnboardingTaskCategory;
  done: boolean;
}

interface OnboardingRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  designation: string;
  joiningDate: string;
  buddyEmployeeId?: number;
  buddyName?: string;
  status: OnboardingStatus;
  tasks: OnboardingTask[];
}

function defaultTasks(): OnboardingTask[] {
  return [
    { id: 1, title: 'Collect signed offer letter', category: 'Documentation', done: false },
    { id: 2, title: 'Collect PAN, Aadhaar, bank details', category: 'Documentation', done: false },
    { id: 3, title: 'Issue laptop', category: 'Asset', done: false },
    { id: 4, title: 'Issue ID card and access badge', category: 'Asset', done: false },
    { id: 5, title: 'Create email and system accounts', category: 'Asset', done: false },
    { id: 6, title: 'Share employee handbook', category: 'Policy', done: false },
    { id: 7, title: 'Acknowledge code of conduct', category: 'Policy', done: false },
    { id: 8, title: 'Schedule orientation session', category: 'Orientation', done: false },
  ];
}

function computeStatus(tasks: OnboardingTask[]): OnboardingStatus {
  const doneCount = tasks.filter((t) => t.done).length;
  if (doneCount === 0) return 'NOT_STARTED';
  if (doneCount === tasks.length) return 'COMPLETED';
  return 'IN_PROGRESS';
}

const EMPLOYMENT_TYPES: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];

interface OnboardForm extends EmployeeRequest {
  buddyEmployeeId: number | '';
}

function emptyForm(): OnboardForm {
  return {
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    dateOfJoining: new Date().toISOString().slice(0, 10),
    employmentType: 'FULL_TIME',
    buddyEmployeeId: '',
  };
}

export function OnboardingPage() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const fieldLabels = useFieldLabels('Employee');
  const { data: employees } = useQuery({ queryKey: ['employees', 'select'], queryFn: () => employeeApi.list(0, 200) });
  const { data: designations } = useQuery({ queryKey: ['designations', 'select'], queryFn: () => designationApi.list(0, 200) });
  const [records, setRecords] = useState<OnboardingRecord[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<OnboardForm>(emptyForm());
  const [viewing, setViewing] = useState<OnboardingRecord | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const selectedDesignation = designations?.content.find((d) => d.id === form.designationId);

  const closeCreate = () => {
    setShowCreate(false);
    setForm(emptyForm());
  };

  const createEmployeeMutation = useMutation({
    mutationFn: (request: EmployeeRequest) => employeeApi.create(request),
    onSuccess: (employee: EmployeeResponse) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      const buddy = employees?.content.find((e) => e.id === form.buddyEmployeeId);
      const tasks = defaultTasks();
      const record: OnboardingRecord = {
        id: employee.id,
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        designation: employee.designationTitle ?? '-',
        joiningDate: employee.dateOfJoining,
        buddyEmployeeId: buddy?.id,
        buddyName: buddy ? `${buddy.firstName} ${buddy.lastName}` : undefined,
        status: computeStatus(tasks),
        tasks,
      };
      setRecords((prev) => [record, ...prev]);
      closeCreate();
      setViewing(record);
    },
  });

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    const { buddyEmployeeId, ...employeeRequest } = form;
    void buddyEmployeeId;
    createEmployeeMutation.mutate(employeeRequest);
  };

  const toggleTask = (recordId: number, taskId: number) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        const tasks = r.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task));
        return { ...r, tasks, status: computeStatus(tasks) };
      }),
    );
    setViewing((prev) => {
      if (!prev || prev.id !== recordId) return prev;
      const tasks = prev.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task));
      return { ...prev, tasks, status: computeStatus(tasks) };
    });
  };

  const addTask = (recordId: number) => {
    if (!newTaskTitle.trim()) return;
    const task: OnboardingTask = { id: Date.now(), title: newTaskTitle.trim(), category: 'Other', done: false };
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        const tasks = [...r.tasks, task];
        return { ...r, tasks, status: computeStatus(tasks) };
      }),
    );
    setViewing((prev) => (prev && prev.id === recordId ? { ...prev, tasks: [...prev.tasks, task] } : prev));
    setNewTaskTitle('');
  };

  const columns: DataTableColumn<OnboardingRecord>[] = [
    { key: 'employee', header: t('fields.name'), render: (r) => r.employeeName },
    { key: 'designation', header: t('fields.designation'), render: (r) => r.designation },
    { key: 'joiningDate', header: t('fields.dateOfJoining'), render: (r) => r.joiningDate },
    { key: 'progress', header: t('pages.onboarding.progress'), render: (r) => `${r.tasks.filter((t) => t.done).length}/${r.tasks.length}` },
    { key: 'status', header: t('fields.status'), render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
  ];

  const categoryOrder: OnboardingTaskCategory[] = ['Documentation', 'Asset', 'Policy', 'Orientation', 'Other'];

  return (
    <div>
      <PageHeader
        title={t('pages.onboarding.title')}
        description={t('pages.onboarding.description')}
        actions={<Button onClick={() => setShowCreate(true)}>{t('pages.onboarding.addButton')}</Button>}
      />

      <DataTable columns={columns} rows={records} getRowKey={(r) => r.id} onView={(r) => setViewing(r)} onDelete={(r) => setRecords((prev) => prev.filter((row) => row.id !== r.id))} />
      <p className="field-hint" style={{ marginTop: 12 }}>{t('pages.onboarding.mockNotice')}</p>

      {showCreate && (
        <Modal title={t('pages.onboarding.addButton')} onClose={closeCreate}>
          <form onSubmit={handleCreate} className="form-grid">
            {!fieldLabels.isHidden('employeeCode') && (
              <TextField label={fieldLabels.label('employeeCode', t('fields.employeeCode'))} value={form.employeeCode}
                onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                required={fieldLabels.isRequired('employeeCode', true)} readOnly={fieldLabels.isReadOnly('employeeCode')} />
            )}
            {!fieldLabels.isHidden('firstName') && (
              <TextField label={fieldLabels.label('firstName', t('fields.firstName'))} value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required={fieldLabels.isRequired('firstName', true)} readOnly={fieldLabels.isReadOnly('firstName')} />
            )}
            {!fieldLabels.isHidden('lastName') && (
              <TextField label={fieldLabels.label('lastName', t('fields.lastName'))} value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required={fieldLabels.isRequired('lastName', true)} readOnly={fieldLabels.isReadOnly('lastName')} />
            )}
            {!fieldLabels.isHidden('email') && (
              <TextField label={fieldLabels.label('email', t('fields.email'))} type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required={fieldLabels.isRequired('email', true)} readOnly={fieldLabels.isReadOnly('email')} />
            )}
            {!fieldLabels.isHidden('designation') && (
              <SelectField label={fieldLabels.label('designation', t('fields.designation'))}
                value={form.designationId ?? ''}
                onChange={(e) => setForm({ ...form, designationId: e.target.value ? Number(e.target.value) : null })}>
                <option value="">{t('common.none')}</option>
                {designations?.content.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </SelectField>
            )}
            <TextField label={t('fields.grade')} value={selectedDesignation?.gradeName ?? t('common.none')} readOnly />
            <SelectField label={t('fields.manager')} value={form.managerId ?? ''}
              onChange={(e) => setForm({ ...form, managerId: e.target.value ? Number(e.target.value) : null })}>
              <option value="">{t('common.none')}</option>
              {employees?.content.map((e) => <option key={e.id} value={e.id}>{e.employeeCode} - {e.firstName} {e.lastName}</option>)}
            </SelectField>
            <SelectField label={t('fields.employmentType')} value={form.employmentType ?? 'FULL_TIME'}
              onChange={(e) => setForm({ ...form, employmentType: e.target.value as EmploymentType })}>
              {EMPLOYMENT_TYPES.map((type) => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
            </SelectField>
            {!fieldLabels.isHidden('dateOfJoining') && (
              <TextField label={fieldLabels.label('dateOfJoining', t('fields.dateOfJoining'))} type="date" value={form.dateOfJoining}
                onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })}
                required={fieldLabels.isRequired('dateOfJoining', true)} readOnly={fieldLabels.isReadOnly('dateOfJoining')} />
            )}
            <TextField label={t('fields.pan')} value={form.pan ?? ''} onChange={(e) => setForm({ ...form, pan: e.target.value })} />
            <TextField label={t('fields.uan')} value={form.uan ?? ''} onChange={(e) => setForm({ ...form, uan: e.target.value })} />
            <TextField label={t('fields.linkedinUrl')} type="url" value={form.linkedinUrl ?? ''} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} />
            <TextField label={t('fields.githubUrl')} type="url" value={form.githubUrl ?? ''} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} />
            <EmployeeSelect value={form.buddyEmployeeId} onChange={(id) => setForm({ ...form, buddyEmployeeId: id })} label={t('pages.onboarding.buddy')} />
            <span className="field-hint" style={{ gridColumn: '1 / -1' }}>{t('pages.onboarding.buddyHint')}</span>
            <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
              <Button type="submit" disabled={createEmployeeMutation.isPending}>
                {createEmployeeMutation.isPending ? t('pages.onboarding.adding') : t('pages.onboarding.addButton')}
              </Button>
              <Button type="button" variant="secondary" onClick={closeCreate}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      {viewing && (
        <Modal title={`${viewing.employeeName} - ${t('pages.onboarding.checklist')}`} onClose={() => setViewing(null)}>
          {categoryOrder.map((category) => {
            const tasksInCategory = viewing.tasks.filter((task) => task.category === category);
            if (tasksInCategory.length === 0) return null;
            return (
              <div key={category} style={{ marginBottom: 16 }}>
                <h3 className="form-section-title">{category}</h3>
                {tasksInCategory.map((task) => (
                  <label className="checkbox-option" key={task.id} style={{ display: 'flex', marginBottom: 8 }}>
                    <input type="checkbox" checked={task.done} onChange={() => toggleTask(viewing.id, task.id)} />
                    {task.title}
                  </label>
                ))}
              </div>
            );
          })}
          <div className="row-actions">
            <TextField label={t('pages.onboarding.addTask')} value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} />
            <Button type="button" variant="secondary" onClick={() => addTask(viewing.id)}>{t('pages.addCandidate.addRow')}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
