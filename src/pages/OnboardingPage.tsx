import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { employeeApi } from '../api/hr/employeeApi';
import { useLocale } from '../context/LocaleContext';
import { Badge, Button, DataTable, EmployeeSelect, Modal, PageHeader, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';

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
  employeeName: string;
  designation: string;
  department: string;
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

function seedRecords(): OnboardingRecord[] {
  const tasksA = defaultTasks().map((t, i) => ({ ...t, done: i < 3 }));
  return [
    { id: 1, employeeName: 'Karan Malhotra', designation: 'Software Engineer', department: 'Engineering', joiningDate: '2026-09-01', buddyName: 'Ananya Rao', status: computeStatus(tasksA), tasks: tasksA },
  ];
}

interface NewHireForm {
  employeeName: string;
  designation: string;
  department: string;
  joiningDate: string;
  buddyEmployeeId: number | '';
}

function emptyForm(): NewHireForm {
  return { employeeName: '', designation: '', department: '', joiningDate: '', buddyEmployeeId: '' };
}

export function OnboardingPage() {
  const { t } = useLocale();
  const { data: employees } = useQuery({ queryKey: ['employees', 'select'], queryFn: () => employeeApi.list(0, 200) });

  const [records, setRecords] = useState<OnboardingRecord[]>(seedRecords());
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<NewHireForm>(emptyForm());
  const [viewing, setViewing] = useState<OnboardingRecord | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const closeCreate = () => {
    setShowCreate(false);
    setForm(emptyForm());
  };

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    const buddy = employees?.content.find((e) => e.id === form.buddyEmployeeId);
    const tasks = defaultTasks();
    setRecords((prev) => [
      {
        id: Date.now(),
        employeeName: form.employeeName,
        designation: form.designation,
        department: form.department,
        joiningDate: form.joiningDate,
        buddyEmployeeId: buddy?.id,
        buddyName: buddy ? `${buddy.firstName} ${buddy.lastName}` : undefined,
        status: computeStatus(tasks),
        tasks,
      },
      ...prev,
    ]);
    closeCreate();
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
            <TextField label={t('fields.name')} value={form.employeeName} onChange={(e) => setForm({ ...form, employeeName: e.target.value })} required />
            <TextField label={t('fields.designation')} value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} required />
            <TextField label={t('fields.department')} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            <div className="field">
              <label className="field-label">{t('fields.dateOfJoining')}</label>
              <input type="date" className="input" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} required />
            </div>
            <EmployeeSelect value={form.buddyEmployeeId} onChange={(id) => setForm({ ...form, buddyEmployeeId: id })} label={t('pages.onboarding.buddy')} />
            <span className="field-hint" style={{ gridColumn: '1 / -1' }}>{t('pages.onboarding.mockNotice')}</span>
            <div className="form-actions">
              <Button type="submit">{t('common.create')}</Button>
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
