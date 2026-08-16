import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gradeApi } from '../api/hr/gradeApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Button, Modal, PageHeader, PagedDataTable, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { GradeRequest, GradeResponse } from '../types/hr';

function emptyForm(): GradeRequest {
  return { name: '', code: '', level: 0 };
}

export function GradesPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<GradeRequest>(emptyForm());
  const [editing, setEditing] = useState<GradeResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const canWrite = hasPermission('hr.grade.write');
  const canDelete = hasPermission('hr.grade.delete');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['grades'] });

  const createMutation = useMutation({
    mutationFn: (request: GradeRequest) => gradeApi.create(request),
    onSuccess: () => { invalidate(); setForm(emptyForm()); setShowCreate(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: GradeRequest }) => gradeApi.update(id, request),
    onSuccess: () => { invalidate(); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => gradeApi.delete(id),
    onSuccess: invalidate,
  });

  const columns: DataTableColumn<GradeResponse>[] = [
    { key: 'level', header: t('fields.level'), render: (g) => g.level, sortKey: 'level' },
    { key: 'name', header: t('fields.grade'), render: (g) => g.name, sortKey: 'name' },
    { key: 'code', header: t('fields.code'), render: (g) => g.code, sortKey: 'code' },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (g) => (
        <div className="row-actions">
          {canWrite && <Button variant="secondary" onClick={() => setEditing(g)}>{t('common.edit')}</Button>}
          {canDelete && (
            <Button variant="danger" onClick={() => window.confirm(t('common.confirmDelete')) && deleteMutation.mutate(g.id)}>
              {t('common.delete')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.grades.title')}
        description={t('pages.grades.description')}
        actions={canWrite ? <Button onClick={() => setShowCreate(true)}>{t('pages.grades.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.grades.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createMutation.mutate(form); }} className="form-grid">
            <TextField label={t('fields.grade')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField label={t('fields.code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            <TextField label={t('fields.level')} type="number" value={form.level}
              onChange={(e) => setForm({ ...form, level: Number(e.target.value) })} required />
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      <PagedDataTable columns={columns} queryKey={['grades']} fetchPage={gradeApi.list} getRowKey={(g) => g.id} />

      {editing && (
        <Modal title={t('pages.grades.editTitle')} onClose={() => setEditing(null)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updateMutation.mutate({ id: editing.id, request: { name: editing.name, code: editing.code, level: editing.level } });
            }}
            className="form-grid"
          >
            <TextField label={t('fields.grade')} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
            <TextField label={t('fields.code')} value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} required />
            <TextField label={t('fields.level')} type="number" value={editing.level}
              onChange={(e) => setEditing({ ...editing, level: Number(e.target.value) })} required />
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
