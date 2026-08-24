import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeDocumentApi } from '../api/hr/employeeDocumentApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Button, PagedDataTable, TextField } from './ui';
import type { ActionMenuItem, DataTableColumn } from './ui';
import type { EmployeeDocumentResponse } from '../types/hr';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * The upload form + document list for one employee - shared between EmployeesPage's row-action
 * modal and EmployeeDetailPage's inline "Documents" card, so both surfaces stay in sync
 * instead of drifting into two copies of the same upload/list/delete logic.
 */
export function EmployeeDocumentsSection({ employeeId }: { employeeId: number }) {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [documentType, setDocumentType] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const canWrite = hasPermission('hr.document.write');
  const canDelete = hasPermission('hr.document.delete');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('File is required');
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

  const columns: DataTableColumn<EmployeeDocumentResponse>[] = [
    { key: 'documentType', header: t('pages.employeeDocuments.documentType'), render: (d) => d.documentType },
    { key: 'fileName', header: t('pages.employeeDocuments.fileName'), render: (d) => d.originalFileName },
    { key: 'size', header: t('pages.employeeDocuments.fileSize'), render: (d) => formatFileSize(d.fileSize) },
  ];

  const extraActions = (d: EmployeeDocumentResponse): ActionMenuItem[] => [
    { label: t('pages.employeeDocuments.download'), onClick: () => employeeDocumentApi.download(d.id, d.originalFileName) },
  ];

  return (
    <>
      {canWrite && (
        <form
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            uploadMutation.mutate();
          }}
          className="form-grid"
          style={{ marginBottom: 16 }}
        >
          <TextField label={t('pages.employeeDocuments.documentType')} value={documentType}
            onChange={(e) => setDocumentType(e.target.value)} required />
          <TextField label={t('pages.employeeDocuments.file')} type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
          <div className="form-actions">
            <Button type="submit" disabled={uploadMutation.isPending || !file}>
              {uploadMutation.isPending ? t('common.saving') : t('pages.employeeDocuments.upload')}
            </Button>
          </div>
        </form>
      )}
      <PagedDataTable
        columns={columns}
        queryKey={['employee-documents', employeeId]}
        fetchPage={(page, size, sort) => employeeDocumentApi.list(employeeId, page, size, sort)}
        getRowKey={(d) => d.id}
        pageSize={10}
        emptyMessage={t('pages.employeeDocuments.empty')}
        onDelete={canDelete ? (d) => deleteMutation.mutate(d.id) : undefined}
        extraActions={extraActions}
      />
    </>
  );
}
