import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '../api/hr/taskApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, EmployeeSelect, Modal, PageHeader, PagedDataTable, SelectField, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { TaskPriority, TaskRequest, TaskResponse, TaskStatus } from '../types/tasks';

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

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
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const canWrite = hasPermission('task.write');
  const canDelete = hasPermission('task.delete');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<TaskForm>(emptyForm());
  const [viewing, setViewing] = useState<TaskResponse | null>(null);
  const [newSubtaskLabel, setNewSubtaskLabel] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tasks'] });

  const closeCreate = () => {
    setShowCreate(false);
    setForm(emptyForm());
  };

  const createMutation = useMutation({
    mutationFn: (request: TaskRequest) => taskApi.create(request),
    onSuccess: () => { invalidate(); closeCreate(); },
  });

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    if (!form.assignedToEmployeeId) return;
    createMutation.mutate({
      title: form.title,
      description: form.description || undefined,
      assignedToEmployeeId: form.assignedToEmployeeId,
      dueDate: form.dueDate || null,
      priority: form.priority,
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => taskApi.delete(id),
    onSuccess: invalidate,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) => taskApi.updateStatus(id, { status }),
    onSuccess: invalidate,
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: ({ id, subtaskId }: { id: number; subtaskId: number }) => taskApi.toggleSubtask(id, subtaskId),
    onSuccess: (updated) => {
      invalidate();
      setViewing((prev) => (prev && prev.id === updated.id ? updated : prev));
    },
  });

  const addSubtaskMutation = useMutation({
    mutationFn: ({ id, label }: { id: number; label: string }) => taskApi.addSubtask(id, { label }),
    onSuccess: (updated) => {
      invalidate();
      setViewing((prev) => (prev && prev.id === updated.id ? updated : prev));
      setNewSubtaskLabel('');
    },
  });

  const columns: DataTableColumn<TaskResponse>[] = [
    { key: 'title', header: t('fields.title'), render: (task) => task.title, sortKey: 'title' },
    { key: 'assignee', header: t('pages.tasks.assignedTo'), render: (task) => task.assignedToName },
    { key: 'dueDate', header: t('fields.dueDate'), render: (task) => task.dueDate ?? '-' },
    { key: 'priority', header: t('pages.tasks.priority'), render: (task) => task.priority },
    { key: 'status', header: t('fields.status'), render: (task) => <Badge tone={statusTone(task.status)}>{task.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.tasks.title')}
        description={t('pages.tasks.description')}
        actions={canWrite && <Button onClick={() => setShowCreate(true)}>{t('pages.tasks.addButton')}</Button>}
      />

      <PagedDataTable
        columns={columns}
        queryKey={['tasks']}
        fetchPage={taskApi.list}
        getRowKey={(task) => task.id}
        onView={(task) => setViewing(task)}
        onDelete={canDelete ? (task) => deleteMutation.mutate(task.id) : undefined}
        extraActions={(task) =>
          canWrite
            ? STATUSES.filter((s) => s !== task.status).map((s) => ({
                label: `${t('pages.tasks.moveTo')} ${s}`,
                onClick: () => statusMutation.mutate({ id: task.id, status: s }),
              }))
            : []
        }
      />

      {showCreate && (
        <Modal title={t('pages.tasks.addButton')} onClose={closeCreate}>
          <form onSubmit={handleCreate} className="form-grid">
            <TextField label={t('fields.title')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <EmployeeSelect value={form.assignedToEmployeeId} onChange={(id) => setForm({ ...form, assignedToEmployeeId: id })} label={t('pages.tasks.assignedTo')} required />
            <div className="field">
              <label className="field-label">{t('fields.dueDate')}</label>
              <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <SelectField label={t('pages.tasks.priority')} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </SelectField>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">{t('fields.description')}</label>
              <textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-actions">
              <Button type="submit" disabled={!form.assignedToEmployeeId || createMutation.isPending}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
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
              <input
                type="checkbox"
                checked={s.done}
                disabled={!canWrite || toggleSubtaskMutation.isPending}
                onChange={() => toggleSubtaskMutation.mutate({ id: viewing.id, subtaskId: s.id })}
              />
              {s.label}
            </label>
          ))}
          {canWrite && (
            <div className="row-actions" style={{ marginTop: 12 }}>
              <TextField label={t('pages.tasks.addSubtask')} value={newSubtaskLabel} onChange={(e) => setNewSubtaskLabel(e.target.value)} />
              <Button
                type="button"
                variant="secondary"
                disabled={!newSubtaskLabel.trim() || addSubtaskMutation.isPending}
                onClick={() => addSubtaskMutation.mutate({ id: viewing.id, label: newSubtaskLabel.trim() })}
              >
                {t('pages.addCandidate.addRow')}
              </Button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
