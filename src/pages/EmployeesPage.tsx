import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../api/hr/employeeApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useFieldLabels } from '../hooks/useFieldLabels';
import { EmployeeDocumentsSection } from '../components/EmployeeDocumentsSection';
import type { EmployeeResponse, GenerateCredentialsResponse } from '../types/hr';
import { Badge, Button, Modal, PageHeader, PagedDataTable, TextField, statusTone } from '../components/ui';
import type { ActionMenuItem, DataTableColumn } from '../components/ui';

function EmployeeDocumentsModal({ employee, onClose }: { employee: EmployeeResponse; onClose: () => void }) {
  const { t } = useLocale();
  return (
    <Modal title={`${t('pages.employeeDocuments.title')} - ${employee.firstName} ${employee.lastName}`} onClose={onClose}>
      <EmployeeDocumentsSection employeeId={employee.id} />
    </Modal>
  );
}

export function EmployeesPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fieldLabels = useFieldLabels('Employee');
  const [credentials, setCredentials] = useState<GenerateCredentialsResponse | null>(null);
  const [documentsFor, setDocumentsFor] = useState<EmployeeResponse | null>(null);

  const canManageCredentials = hasPermission('hr.employee.credentials');
  const canViewDocuments = hasPermission('hr.document.read');
  const canDeactivate = hasPermission('hr.employee.delete');

  // One bundled call for everything the filter row's dropdowns need, rather than one request
  // per select filter - statuses come live off the backend EmployeeStatus enum, never hardcoded.
  const { data: filterOptions } = useQuery({
    queryKey: ['employees', 'filter-options'],
    queryFn: employeeApi.getFilterOptions,
    staleTime: Infinity,
  });

  const generateCredentialsMutation = useMutation({
    mutationFn: (id: number) => employeeApi.generateCredentials(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setCredentials(response);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: number) => employeeApi.resetPassword(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setCredentials(response);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => employeeApi.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const columns: DataTableColumn<EmployeeResponse>[] = [
    {
      key: 'code',
      header: fieldLabels.label('employeeCode', t('fields.employeeCode')),
      render: (e) => e.employeeCode,
      sortKey: 'employeeCode',
      filter: { type: 'text', paramKey: 'employeeCode' },
    },
    {
      key: 'name',
      header: t('fields.user'),
      render: (e) => (
        <div className="table-cell-stack">
          <span>{e.firstName} {e.lastName}</span>
          <span className="table-cell-stack-secondary">{e.email}</span>
        </div>
      ),
      sortKey: 'firstName',
      filter: { type: 'text', paramKey: 'name', placeholder: t('table.filterNameEmail') },
      hideable: false,
    },
    {
      key: 'designation',
      header: fieldLabels.label('designation', t('fields.designation')),
      render: (e) => (
        <div className="table-cell-stack">
          <span>{e.designationTitle ?? '-'}</span>
          <span className="table-cell-stack-secondary">{e.departmentName ?? '-'}</span>
        </div>
      ),
      filter: { type: 'text', paramKey: 'designationTitle', placeholder: t('table.filterDesignation') },
    },
    {
      key: 'manager',
      header: t('fields.manager'),
      render: (e) =>
        e.managerName ? (
          <div className="table-cell-stack">
            <span>{e.managerName}</span>
            <span className="table-cell-stack-secondary">{e.managerEmail}</span>
          </div>
        ) : (
          '-'
        ),
      filter: { type: 'text', paramKey: 'managerName', placeholder: t('table.filterManagerEmail') },
    },
    {
      key: 'status',
      header: t('fields.status'),
      render: (e) => <Badge tone={statusTone(e.status)}>{e.status}</Badge>,
      sortKey: 'status',
      filter: { type: 'select', paramKey: 'status', options: filterOptions?.statuses ?? [] },
    },
  ];

  const extraActions = (e: EmployeeResponse): ActionMenuItem[] => {
    const items: ActionMenuItem[] = [];
    if (canManageCredentials) {
      if (e.hasUserAccount) {
        items.push({
          label: t('pages.employees.resetPassword'),
          disabled: resetPasswordMutation.isPending,
          onClick: () => resetPasswordMutation.mutate(e.id),
        });
      } else {
        items.push({
          label: t('pages.employees.generateCredentials'),
          disabled: generateCredentialsMutation.isPending,
          onClick: () => generateCredentialsMutation.mutate(e.id),
        });
      }
    }
    if (canViewDocuments) {
      items.push({ label: t('pages.employeeDocuments.button'), onClick: () => setDocumentsFor(e) });
    }
    if (canDeactivate && e.status === 'ACTIVE') {
      items.push({
        label: t('pages.employees.deactivate'),
        tone: 'danger',
        disabled: deactivateMutation.isPending,
        onClick: () =>
          window.confirm(t('pages.employees.confirmDeactivate')) && deactivateMutation.mutate(e.id),
      });
    }
    return items;
  };

  return (
    <div>
      <PageHeader title={t('pages.employees.title')} description={t('pages.employees.description')} />

      <PagedDataTable
        columns={columns}
        queryKey={['employees']}
        fetchPage={employeeApi.list}
        getRowKey={(e) => e.id}
        emptyMessage={t('pages.employees.empty')}
        onView={(e) => navigate(`/employees/${e.id}`)}
        extraActions={extraActions}
      />

      {credentials && (
        <Modal title={t('pages.employees.credentialsTitle')} onClose={() => setCredentials(null)}>
          <p>{t('pages.employees.credentialsHint')}</p>
          <TextField label={t('fields.email')} value={credentials.email} readOnly />
          <div className="form-actions">
            <Button type="button" onClick={() => setCredentials(null)}>{t('common.close')}</Button>
          </div>
        </Modal>
      )}

      {documentsFor && <EmployeeDocumentsModal employee={documentsFor} onClose={() => setDocumentsFor(null)} />}
    </div>
  );
}
