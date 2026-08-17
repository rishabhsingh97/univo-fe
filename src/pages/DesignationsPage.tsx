import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { designationApi } from '../api/hr/designationApi';
import { gradeApi } from '../api/hr/gradeApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Button, Modal, PageHeader, PagedDataTable, SelectField, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { DesignationRequest, DesignationResponse } from '../types/hr';

function emptyForm(): DesignationRequest {
  return { title: '', code: '', gradeId: 0 };
}

export function DesignationsPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<DesignationRequest>(emptyForm());
  const [editing, setEditing] = useState<DesignationResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const canWrite = hasPermission('hr.designation.write');
  const canDelete = hasPermission('hr.designation.delete');

  // Unpaginated, for the Grade picker in the create/edit forms below.
  const { data: allGrades } = useQuery({ queryKey: ['grades', 'select'], queryFn: () => gradeApi.list(0, 200) });
  const gradeOptions = allGrades?.content ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['designations'] });

  const createMutation = useMutation({
    mutationFn: (request: DesignationRequest) => designationApi.create(request),
    onSuccess: () => { invalidate(); setForm(emptyForm()); setShowCreate(false); },
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
    { key: 'grade', header: t('fields.grade'), render: (d) => d.gradeName ?? '-' },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.designations.title')}
        description={t('pages.designations.description')}
        actions={canWrite ? <Button onClick={() => setShowCreate(true)}>{t('pages.designations.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.designations.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createMutation.mutate(form); }} className="form-grid">
            <TextField label={t('fields.designation')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <TextField label={t('fields.code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            <SelectField label={t('fields.grade')} value={form.gradeId || ''}
              onChange={(e) => setForm({ ...form, gradeId: Number(e.target.value) })} required>
              <option value="">{t('common.selectOption')}</option>
              {gradeOptions.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </SelectField>
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending || !form.gradeId}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      <PagedDataTable
        columns={columns}
        queryKey={['designations']}
        fetchPage={designationApi.list}
        getRowKey={(d) => d.id}
        onEdit={canWrite ? (d) => setEditing(d) : undefined}
        onDelete={canDelete ? (d) => deleteMutation.mutate(d.id) : undefined}
      />

      {editing && (
        <Modal title={t('pages.designations.editTitle')} onClose={() => setEditing(null)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updateMutation.mutate({
                id: editing.id,
                request: { title: editing.title, code: editing.code, gradeId: editing.gradeId ?? 0 },
              });
            }}
            className="form-grid"
          >
            <TextField label={t('fields.designation')} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} required />
            <TextField label={t('fields.code')} value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} required />
            <SelectField label={t('fields.grade')} value={editing.gradeId ?? ''}
              onChange={(e) => setEditing({ ...editing, gradeId: Number(e.target.value) })} required>
              <option value="">{t('common.selectOption')}</option>
              {gradeOptions.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </SelectField>
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
