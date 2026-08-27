import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useLocale } from '../context/LocaleContext';
import { Button, DataTable, Modal, PageHeader, SelectField, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';

// Mock-only company file library - separate from the real per-employee Employee Documents
// feature (src/components/EmployeeDocumentsSection.tsx), which is unaffected by this page.

type FileCategory = 'Policy' | 'Form' | 'Template' | 'General';

interface CompanyFile {
  id: number;
  name: string;
  category: FileCategory;
  description: string;
  uploadedByName: string;
  uploadedDate: string;
  fileName: string;
}

const CATEGORIES: FileCategory[] = ['Policy', 'Form', 'Template', 'General'];

function seedFiles(): CompanyFile[] {
  return [
    { id: 1, name: 'Leave Policy 2026', category: 'Policy', description: 'Annual and sick leave entitlements', uploadedByName: 'HR Team', uploadedDate: '2026-01-05', fileName: 'leave-policy-2026.pdf' },
    { id: 2, name: 'Expense Claim Form', category: 'Form', description: 'Reimbursement claim template', uploadedByName: 'Finance Team', uploadedDate: '2026-02-12', fileName: 'expense-claim-form.docx' },
    { id: 3, name: 'Offer Letter Template', category: 'Template', description: 'Standard offer letter format', uploadedByName: 'HR Team', uploadedDate: '2026-03-01', fileName: 'offer-letter-template.docx' },
    { id: 4, name: 'Employee Handbook', category: 'General', description: 'Company policies and code of conduct', uploadedByName: 'HR Team', uploadedDate: '2026-01-15', fileName: 'employee-handbook.pdf' },
  ];
}

interface UploadForm {
  name: string;
  category: FileCategory;
  description: string;
  fileName: string;
}

function emptyUploadForm(): UploadForm {
  return { name: '', category: 'General', description: '', fileName: '' };
}

export function FilesPage() {
  const { t } = useLocale();
  const [files, setFiles] = useState<CompanyFile[]>(seedFiles());
  const [categoryFilter, setCategoryFilter] = useState<FileCategory | 'All'>('All');
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState<UploadForm>(emptyUploadForm());

  const filtered = categoryFilter === 'All' ? files : files.filter((f) => f.category === categoryFilter);

  const closeUpload = () => {
    setShowUpload(false);
    setForm(emptyUploadForm());
  };

  const handleUpload = (event: FormEvent) => {
    event.preventDefault();
    setFiles((prev) => [
      { id: Date.now(), name: form.name, category: form.category, description: form.description, uploadedByName: 'You', uploadedDate: new Date().toISOString().slice(0, 10), fileName: form.fileName || 'file' },
      ...prev,
    ]);
    closeUpload();
  };

  const columns: DataTableColumn<CompanyFile>[] = [
    { key: 'name', header: t('fields.name'), render: (f) => f.name },
    { key: 'category', header: t('pages.files.category'), render: (f) => f.category },
    { key: 'description', header: t('fields.description'), render: (f) => f.description || '-' },
    { key: 'uploadedBy', header: t('pages.files.uploadedBy'), render: (f) => f.uploadedByName },
    { key: 'uploadedDate', header: t('pages.files.uploadedDate'), render: (f) => f.uploadedDate },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.files.title')}
        description={t('pages.files.description')}
        actions={<Button onClick={() => setShowUpload(true)}>{t('pages.files.uploadButton')}</Button>}
      />

      <div className="row-actions" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Button variant={categoryFilter === 'All' ? 'primary' : 'secondary'} onClick={() => setCategoryFilter('All')}>
          {t('common.all')}
        </Button>
        {CATEGORIES.map((c) => (
          <Button key={c} variant={categoryFilter === c ? 'primary' : 'secondary'} onClick={() => setCategoryFilter(c)}>
            {c}
          </Button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={(f) => f.id}
        onDelete={(f) => setFiles((prev) => prev.filter((row) => row.id !== f.id))}
      />
      <p className="field-hint" style={{ marginTop: 12 }}>{t('pages.files.mockNotice')}</p>

      {showUpload && (
        <Modal title={t('pages.files.uploadButton')} onClose={closeUpload}>
          <form onSubmit={handleUpload} className="form-grid">
            <TextField label={t('fields.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <SelectField label={t('pages.files.category')} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as FileCategory })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectField>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label" htmlFor="file-description">{t('fields.description')}</label>
              <textarea id="file-description" className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="upload-field">
              <div className="upload-dropzone">
                <input type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, fileName: e.target.files?.[0]?.name ?? '' })} />
                <span className="upload-filename">{form.fileName || t('pages.addCandidate.noFileChosen')}</span>
              </div>
            </div>
            <span className="field-hint" style={{ gridColumn: '1 / -1' }}>{t('pages.files.mockNotice')}</span>
            <div className="form-actions">
              <Button type="submit">{t('common.create')}</Button>
              <Button type="button" variant="secondary" onClick={closeUpload}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
