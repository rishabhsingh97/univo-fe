import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { employeeApi } from '../api/hr/employeeApi';
import { useLocale } from '../context/LocaleContext';
import { Badge, Button, DataTable, EmployeeSelect, Modal, PageHeader, SelectField, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';

type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

interface SubTask {
  id: number;
  label: string;
  done: boolean;
}

interface TaskItem {
  id: number;
  title: string;
  description: string;
  assignedToName: string;
  assignedToEmployeeId: number;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  subtasks: SubTask[];
}

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

function seedTasks(): TaskItem[] {
  return [
    {
      id: 1,
      title: 'Prepare Q3 headcount report',
      description: 'Pull headcount and attrition numbers for the leadership review.',
      assignedToName: 'Ananya Rao',
      assignedToEmployeeId: 0,
      dueDate: '2026-08-28',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      subtasks: [
        { id: 1, label: 'Export headcount by department', done: true },
        { id: 2, label: 'Compute attrition rate', done: false },
        { id: 3, label: 'Build summary slide', done: false },
      ],
    },
    {
      id: 2,
      title: 'Update vendor contract',
      description: 'Renew the payroll processing vendor agreement.',
      assignedToName: 'Vikram Shah',
      assignedToEmployeeId: 0,
      dueDate: '2026-09-05',
      priority: 'MEDIUM',
      status: 'TODO',
      subtasks: [{ id: 1, label: 'Review redlines from legal', done: false }],
    },
  ];
}

interface TaskForm {
  title: string;
  description: string;
  assignedToEmployeeId: number | '';
  dueDate: string;
  priority: TaskPriority;
}

function emptyForm(): TaskForm {
  return { title: '', description: '', assignedToEmployeeId: '', dueDate: '', priority: 'MEDIUM' };
}

export function TasksPage() {
  const { t } = useLocale();
  const { data: employees } = useQuery({ queryKey: ['employees', 'select'], queryFn: () => employeeApi.list(0, 200) });

  const [tasks, setTasks] = useState<TaskItem[]>(seedTasks());
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<TaskForm>(emptyForm());
  const [viewing, setViewing] = useState<TaskItem | null>(null);
  const [newSubtaskLabel, setNewSubtaskLabel] = useState('');

  const closeCreate = () => {
    setShowCreate(false);
    setForm(emptyForm());
  };

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    const employee = employees?.content.find((e) => e.id === form.assignedToEmployeeId);
    if (!employee) return;
    setTasks((prev) => [
      {
        id: Date.now(),
        title: form.title,
        description: form.description,
        assignedToName: `${employee.firstName} ${employee.lastName}`,
        assignedToEmployeeId: employee.id,
        dueDate: form.dueDate,
        priority: form.priority,
        status: 'TODO',
        subtasks: [],
      },
      ...prev,
    ]);
    closeCreate();
  };

  const setTaskStatus = (id: number, status: TaskStatus) =>
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status } : task)));

  const toggleSubtask = (taskId: number, subtaskId: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, subtasks: task.subtasks.map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s)) }
          : task,
      ),
    );
    setViewing((prev) =>
      prev && prev.id === taskId
        ? { ...prev, subtasks: prev.subtasks.map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s)) }
        : prev,
    );
  };

  const addSubtask = (taskId: number) => {
    if (!newSubtaskLabel.trim()) return;
    const subtask: SubTask = { id: Date.now(), label: newSubtaskLabel.trim(), done: false };
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, subtasks: [...task.subtasks, subtask] } : task)));
    setViewing((prev) => (prev && prev.id === taskId ? { ...prev, subtasks: [...prev.subtasks, subtask] } : prev));
    setNewSubtaskLabel('');
  };

  const columns: DataTableColumn<TaskItem>[] = [
    { key: 'title', header: t('fields.title'), render: (task) => task.title },
    { key: 'assignee', header: t('pages.tasks.assignedTo'), render: (task) => task.assignedToName },
    { key: 'dueDate', header: t('fields.dueDate'), render: (task) => task.dueDate },
    { key: 'priority', header: t('pages.tasks.priority'), render: (task) => task.priority },
    { key: 'status', header: t('fields.status'), render: (task) => <Badge tone={statusTone(task.status)}>{task.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.tasks.title')}
        description={t('pages.tasks.description')}
        actions={<Button onClick={() => setShowCreate(true)}>{t('pages.tasks.addButton')}</Button>}
      />

      <DataTable
        columns={columns}
        rows={tasks}
        getRowKey={(task) => task.id}
        onView={(task) => setViewing(task)}
        onDelete={(task) => setTasks((prev) => prev.filter((row) => row.id !== task.id))}
        extraActions={(task) =>
          STATUSES.filter((s) => s !== task.status).map((s) => ({
            label: `${t('pages.tasks.moveTo')} ${s}`,
            onClick: () => setTaskStatus(task.id, s),
          }))
        }
      />
      <p className="field-hint" style={{ marginTop: 12 }}>{t('pages.tasks.mockNotice')}</p>

      {showCreate && (
        <Modal title={t('pages.tasks.addButton')} onClose={closeCreate}>
          <form onSubmit={handleCreate} className="form-grid">
            <TextField label={t('fields.title')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <EmployeeSelect value={form.assignedToEmployeeId} onChange={(id) => setForm({ ...form, assignedToEmployeeId: id })} label={t('pages.tasks.assignedTo')} required />
            <div className="field">
              <label className="field-label">{t('fields.dueDate')}</label>
              <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
            </div>
            <SelectField label={t('pages.tasks.priority')} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </SelectField>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">{t('fields.description')}</label>
              <textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <span className="field-hint" style={{ gridColumn: '1 / -1' }}>{t('pages.tasks.mockNotice')}</span>
            <div className="form-actions">
              <Button type="submit" disabled={!form.assignedToEmployeeId}>{t('common.create')}</Button>
              <Button type="button" variant="secondary" onClick={closeCreate}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      {viewing && (
        <Modal title={viewing.title} onClose={() => setViewing(null)}>
          <p>{viewing.description || '-'}</p>
          <h3 className="form-section-title">{t('pages.tasks.subtasks')}</h3>
          {viewing.subtasks.map((s) => (
            <label className="checkbox-option" key={s.id} style={{ display: 'flex', marginBottom: 8 }}>
              <input type="checkbox" checked={s.done} onChange={() => toggleSubtask(viewing.id, s.id)} />
              {s.label}
            </label>
          ))}
          <div className="row-actions" style={{ marginTop: 12 }}>
            <TextField label={t('pages.tasks.addSubtask')} value={newSubtaskLabel} onChange={(e) => setNewSubtaskLabel(e.target.value)} />
            <Button type="button" variant="secondary" onClick={() => addSubtask(viewing.id)}>{t('pages.addCandidate.addRow')}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
