import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyFileApi } from '../api/common/companyFileApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Button, Modal, PageHeader, PagedDataTable, SelectField, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { CompanyFileCategory, CompanyFileResponse } from '../types/companyFiles';

const CATEGORIES: CompanyFileCategory[] = ['POLICY', 'FORM', 'TEMPLATE', 'GENERAL'];

interface UploadForm {
  name: string;
  category: CompanyFileCategory;
  description: string;
  file: File | null;
}

function emptyUploadForm(): UploadForm {
  return { name: '', category: 'GENERAL', description: '', file: null };
}

export function FilesPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canManage = hasPermission('file.manage');

  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState<UploadForm>(emptyUploadForm());

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['company-files'] });

  const closeUpload = () => {
    setShowUpload(false);
    setForm(emptyUploadForm());
  };

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!form.file) return Promise.reject(new Error('No file selected'));
      return companyFileApi.upload(form.name, form.category, form.description, form.file);
    },
    onSuccess: () => { invalidate(); closeUpload(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => companyFileApi.delete(id),
    onSuccess: invalidate,
  });

  const handleUpload = (event: FormEvent) => {
    event.preventDefault();
    if (!form.file) return;
    uploadMutation.mutate();
  };

  const columns: DataTableColumn<CompanyFileResponse>[] = [
    { key: 'name', header: t('fields.name'), render: (f) => f.name },
    { key: 'category', header: t('pages.files.category'), render: (f) => f.category },
    { key: 'description', header: t('fields.description'), render: (f) => f.description || '-' },
    { key: 'uploadedBy', header: t('pages.files.uploadedBy'), render: (f) => f.uploadedByName ?? '-' },
    { key: 'uploadedDate', header: t('pages.files.uploadedDate'), render: (f) => new Date(f.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.files.title')}
        description={t('pages.files.description')}
        actions={canManage && <Button onClick={() => setShowUpload(true)}>{t('pages.files.uploadButton')}</Button>}
      />

      <PagedDataTable
        columns={columns}
        queryKey={['company-files']}
        fetchPage={companyFileApi.list}
        getRowKey={(f) => f.id}
        onDelete={canManage ? (f) => deleteMutation.mutate(f.id) : undefined}
        extraActions={(f) => [
          { label: t('pages.files.download'), onClick: () => companyFileApi.download(f.id, f.originalFileName) },
        ]}
      />

      {showUpload && (
        <Modal title={t('pages.files.uploadButton')} onClose={closeUpload}>
          <form onSubmit={handleUpload} className="form-grid">
            <TextField label={t('fields.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <SelectField label={t('pages.files.category')} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as CompanyFileCategory })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectField>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label" htmlFor="file-description">{t('fields.description')}</label>
              <textarea id="file-description" className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="upload-field">
              <div className="upload-dropzone">
                <input type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, file: e.target.files?.[0] ?? null })} required />
                <span className="upload-filename">{form.file?.name ?? t('pages.addCandidate.noFileChosen')}</span>
              </div>
            </div>
            <div className="form-actions">
              <Button type="submit" disabled={!form.file || uploadMutation.isPending}>
                {uploadMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={closeUpload}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
