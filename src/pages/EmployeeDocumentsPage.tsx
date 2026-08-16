import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeDocumentApi } from '../api/hr/employeeDocumentApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Button, Card, EmployeeSelect, PageHeader, PagedDataTable, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { EmployeeDocumentResponse } from '../types/hr';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EmployeeDocumentsPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [documentType, setDocumentType] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const canWrite = hasPermission('hr.document.write');
  const canDelete = hasPermission('hr.document.delete');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!employeeId || !file) throw new Error('Employee and file are required');
      return employeeDocumentApi.upload(employeeId, documentType, file);
    },
    onSuccess: () => {
      invalidate();
      setDocumentType('');
      setFile(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => employeeDocumentApi.delete(id),
    onSuccess: invalidate,
  });

  const handleUpload = (event: FormEvent) => {
    event.preventDefault();
    uploadMutation.mutate();
  };

  const columns: DataTableColumn<EmployeeDocumentResponse>[] = [
    { key: 'documentType', header: t('pages.employeeDocuments.documentType'), render: (d) => d.documentType },
    { key: 'fileName', header: t('pages.employeeDocuments.fileName'), render: (d) => d.originalFileName },
    { key: 'size', header: t('pages.employeeDocuments.fileSize'), render: (d) => formatSize(d.fileSize) },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (d) => (
        <div className="row-actions">
          <Button variant="secondary" onClick={() => employeeDocumentApi.download(d.id, d.originalFileName)}>
            {t('pages.employeeDocuments.download')}
          </Button>
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
    <div>
      <PageHeader title={t('pages.employeeDocuments.title')} description={t('pages.employeeDocuments.description')} />

      <Card style={{ marginBottom: 16 }}>
        <EmployeeSelect value={employeeId} onChange={setEmployeeId} />
      </Card>

      {employeeId && (
        <>
          {canWrite && (
            <Card style={{ marginBottom: 16 }}>
              <form onSubmit={handleUpload} className="form-grid">
                <TextField
                  label={t('pages.employeeDocuments.documentType')}
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  required
                />
                <TextField
                  label={t('pages.employeeDocuments.file')}
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  required
                />
                <div className="form-actions">
                  <Button type="submit" disabled={uploadMutation.isPending || !file}>
                    {uploadMutation.isPending ? t('common.saving') : t('pages.employeeDocuments.upload')}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <PagedDataTable
            columns={columns}
            queryKey={['employee-documents', employeeId]}
            fetchPage={(page, size, sort) => employeeDocumentApi.list(employeeId, page, size, sort)}
            getRowKey={(d) => d.id}
          />
        </>
      )}
    </div>
  );
}
