import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { designationApi } from '../api/hr/designationApi';
import { gradeApi } from '../api/hr/gradeApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Modal, PageHeader, PagedDataTable, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { DesignationRequest, DesignationResponse, GradeRequest, GradeResponse } from '../types/hr';

function emptyDesignationForm(): DesignationRequest {
  return { title: '', code: '' };
}

function emptyGradeForm(): GradeRequest {
  return { name: '', code: '', rank: 0 };
}

export function DesignationsGradesPage() {
  const { t } = useLocale();
  return (
    <div>
      <PageHeader title={t('pages.designationsGrades.title')} description={t('pages.designationsGrades.description')} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <DesignationsPanel />
        <GradesPanel />
      </div>
    </div>
  );
}

function DesignationsPanel() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<DesignationRequest>(emptyDesignationForm());
  const [editing, setEditing] = useState<DesignationResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const canWrite = hasPermission('hr.designation.write');
  const canDelete = hasPermission('hr.designation.delete');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['designations'] });

  const createMutation = useMutation({
    mutationFn: (request: DesignationRequest) => designationApi.create(request),
    onSuccess: () => { invalidate(); setForm(emptyDesignationForm()); setShowCreate(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: DesignationRequest }) => designationApi.update(id, request),
    onSuccess: () => { invalidate(); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => designationApi.delete(id),
    onSuccess: invalidate,
  });

  const columns: DataTableColumn<DesignationResponse>[] = [
    { key: 'title', header: t('fields.designation'), render: (d) => d.title, sortKey: 'title' },
    { key: 'code', header: t('fields.code'), render: (d) => d.code, sortKey: 'code' },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (d) => (
        <div className="row-actions">
          {canWrite && <Button variant="secondary" onClick={() => setEditing(d)}>{t('common.edit')}</Button>}
          {canDelete && (
            <Button variant="danger" onClick={() => window.confirm(t('common.confirmDelete')) && deleteMutation.mutate(d.id)}>
              {t('common.delete')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card>
      <div className="row-actions" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{t('pages.designationsGrades.designations')}</h2>
        {canWrite && <Button onClick={() => setShowCreate(true)}>{t('common.create')}</Button>}
      </div>
      {showCreate && (
        <Modal title={t('pages.designationsGrades.designations')} onClose={() => setShowCreate(false)}>
          <form
            onSubmit={(event: FormEvent) => { event.preventDefault(); createMutation.mutate(form); }}
            className="form-grid"
          >
            <TextField label={t('fields.designation')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <TextField label={t('fields.code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
      <PagedDataTable columns={columns} queryKey={['designations']} fetchPage={designationApi.list} getRowKey={(d) => d.id} pageSize={20} />
      {editing && (
        <Modal title={t('common.edit')} onClose={() => setEditing(null)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updateMutation.mutate({ id: editing.id, request: { title: editing.title, code: editing.code } });
            }}
            className="form-grid"
          >
            <TextField label={t('fields.designation')} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} required />
            <TextField label={t('fields.code')} value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} required />
            <div className="form-actions">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t('common.saving') : t('common.save')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </Card>
  );
}

function GradesPanel() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<GradeRequest>(emptyGradeForm());
  const [editing, setEditing] = useState<GradeResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const canWrite = hasPermission('hr.grade.write');
  const canDelete = hasPermission('hr.grade.delete');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['grades'] });

  const createMutation = useMutation({
    mutationFn: (request: GradeRequest) => gradeApi.create(request),
    onSuccess: () => { invalidate(); setForm(emptyGradeForm()); setShowCreate(false); },
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
    { key: 'name', header: t('fields.grade'), render: (g) => g.name, sortKey: 'name' },
    { key: 'code', header: t('fields.code'), render: (g) => g.code, sortKey: 'code' },
    { key: 'rank', header: t('fields.rank'), render: (g) => g.rank, sortKey: 'rank' },
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
    <Card>
      <div className="row-actions" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{t('pages.designationsGrades.grades')}</h2>
        {canWrite && <Button onClick={() => setShowCreate(true)}>{t('common.create')}</Button>}
      </div>
      {showCreate && (
        <Modal title={t('pages.designationsGrades.grades')} onClose={() => setShowCreate(false)}>
          <form
            onSubmit={(event: FormEvent) => { event.preventDefault(); createMutation.mutate(form); }}
            className="form-grid"
          >
            <TextField label={t('fields.grade')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField label={t('fields.code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            <TextField label={t('fields.rank')} type="number" value={form.rank}
              onChange={(e) => setForm({ ...form, rank: Number(e.target.value) })} required />
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
      <PagedDataTable columns={columns} queryKey={['grades']} fetchPage={gradeApi.list} getRowKey={(g) => g.id} pageSize={20} />
      {editing && (
        <Modal title={t('common.edit')} onClose={() => setEditing(null)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updateMutation.mutate({ id: editing.id, request: { name: editing.name, code: editing.code, rank: editing.rank } });
            }}
            className="form-grid"
          >
            <TextField label={t('fields.grade')} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
            <TextField label={t('fields.code')} value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} required />
            <TextField label={t('fields.rank')} type="number" value={editing.rank}
              onChange={(e) => setEditing({ ...editing, rank: Number(e.target.value) })} required />
            <div className="form-actions">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t('common.saving') : t('common.save')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </Card>
  );
}
