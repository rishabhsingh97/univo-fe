import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../api/hr/employeeApi';
import { designationApi } from '../api/hr/designationApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useFieldLabels } from '../hooks/useFieldLabels';
import { EmployeeDocumentsSection } from '../components/EmployeeDocumentsSection';
import type {
  EmployeeRequest,
  EmployeeResponse,
  EmploymentType,
  GenerateCredentialsResponse,
} from '../types/hr';
import { Badge, Button, Modal, PageHeader, PagedDataTable, SelectField, TextField, statusTone } from '../components/ui';
import type { ActionMenuItem, DataTableColumn } from '../components/ui';

function EmployeeDocumentsModal({ employee, onClose }: { employee: EmployeeResponse; onClose: () => void }) {
  const { t } = useLocale();
  return (
    <Modal title={`${t('pages.employeeDocuments.title')} - ${employee.firstName} ${employee.lastName}`} onClose={onClose}>
      <EmployeeDocumentsSection employeeId={employee.id} />
    </Modal>
  );
}

const EMPLOYMENT_TYPES: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];

const emptyForm: EmployeeRequest = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  email: '',
  dateOfJoining: new Date().toISOString().slice(0, 10),
  employmentType: 'FULL_TIME',
};

export function EmployeesPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fieldLabels = useFieldLabels('Employee');
  const [form, setForm] = useState<EmployeeRequest>(emptyForm);
  const [showCreate, setShowCreate] = useState(false);
  const [credentials, setCredentials] = useState<GenerateCredentialsResponse | null>(null);
  const [documentsFor, setDocumentsFor] = useState<EmployeeResponse | null>(null);

  const canManageCredentials = hasPermission('hr.employee.credentials');
  const canViewDocuments = hasPermission('hr.document.read');
  const canDeactivate = hasPermission('hr.employee.delete');

  // Full (unpaginated-ish) lists for the pickers below - independent of the table's own page,
  // since a manager/designation/grade selector needs every option, not just the visible page.
  const { data: allEmployees } = useQuery({ queryKey: ['employees', 'select'], queryFn: () => employeeApi.list(0, 200) });
  const { data: designations } = useQuery({ queryKey: ['designations', 'select'], queryFn: () => designationApi.list(0, 200) });
  // One bundled call for everything the filter row's dropdowns need, rather than one request
  // per select filter - statuses come live off the backend EmployeeStatus enum, never hardcoded.
  const { data: filterOptions } = useQuery({
    queryKey: ['employees', 'filter-options'],
    queryFn: employeeApi.getFilterOptions,
    staleTime: Infinity,
  });
  const selectedDesignation = designations?.content.find((d) => d.id === form.designationId);

  const createMutation = useMutation({
    mutationFn: (request: EmployeeRequest) => employeeApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setForm(emptyForm);
      setShowCreate(false);
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate(form);
  };

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
          <span className="table-cell-stack-secondary">{e.orgUnitName ?? '-'}</span>
        </div>
      ),
      filter: { type: 'text', paramKey: 'designationTitle', placeholder: t('table.filterDesignationOrgUnit') },
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
      <PageHeader
        title={t('pages.employees.title')}
        description={t('pages.employees.description')}
        actions={<Button onClick={() => setShowCreate(true)}>{t('pages.employees.addButton')}</Button>}
      />

      {showCreate && (
        <Modal title={t('pages.employees.addButton')} onClose={() => setShowCreate(false)}>
          <form onSubmit={handleSubmit} className="form-grid">
          {!fieldLabels.isHidden('employeeCode') && (
            <TextField label={fieldLabels.label('employeeCode', t('fields.employeeCode'))} value={form.employeeCode}
              onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
              required={fieldLabels.isRequired('employeeCode', true)} readOnly={fieldLabels.isReadOnly('employeeCode')} />
          )}
          {!fieldLabels.isHidden('firstName') && (
            <TextField label={fieldLabels.label('firstName', t('fields.firstName'))} value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required={fieldLabels.isRequired('firstName', true)} readOnly={fieldLabels.isReadOnly('firstName')} />
          )}
          {!fieldLabels.isHidden('lastName') && (
            <TextField label={fieldLabels.label('lastName', t('fields.lastName'))} value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required={fieldLabels.isRequired('lastName', true)} readOnly={fieldLabels.isReadOnly('lastName')} />
          )}
          {!fieldLabels.isHidden('email') && (
            <TextField label={fieldLabels.label('email', t('fields.email'))} type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required={fieldLabels.isRequired('email', true)} readOnly={fieldLabels.isReadOnly('email')} />
          )}
          {!fieldLabels.isHidden('designation') && (
            <SelectField label={fieldLabels.label('designation', t('fields.designation'))}
              value={form.designationId ?? ''}
              onChange={(e) => setForm({ ...form, designationId: e.target.value ? Number(e.target.value) : null })}>
              <option value="">{t('common.none')}</option>
              {designations?.content.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </SelectField>
          )}
          <TextField label={t('fields.grade')} value={selectedDesignation?.gradeName ?? t('common.none')} readOnly />
          <SelectField label={t('fields.manager')} value={form.managerId ?? ''}
            onChange={(e) => setForm({ ...form, managerId: e.target.value ? Number(e.target.value) : null })}>
            <option value="">{t('common.none')}</option>
            {allEmployees?.content.map((e) => <option key={e.id} value={e.id}>{e.employeeCode} - {e.firstName} {e.lastName}</option>)}
          </SelectField>
          <SelectField label={t('fields.employmentType')} value={form.employmentType ?? 'FULL_TIME'}
            onChange={(e) => setForm({ ...form, employmentType: e.target.value as EmploymentType })}>
            {EMPLOYMENT_TYPES.map((type) => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
          </SelectField>
          {!fieldLabels.isHidden('dateOfJoining') && (
            <TextField label={fieldLabels.label('dateOfJoining', t('fields.dateOfJoining'))} type="date" value={form.dateOfJoining}
              onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })}
              required={fieldLabels.isRequired('dateOfJoining', true)} readOnly={fieldLabels.isReadOnly('dateOfJoining')} />
          )}
          <TextField label={t('fields.pan')} value={form.pan ?? ''} onChange={(e) => setForm({ ...form, pan: e.target.value })} />
          <TextField label={t('fields.uan')} value={form.uan ?? ''} onChange={(e) => setForm({ ...form, uan: e.target.value })} />
          <TextField label={t('fields.linkedinUrl')} type="url" value={form.linkedinUrl ?? ''} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} />
          <TextField label={t('fields.githubUrl')} type="url" value={form.githubUrl ?? ''} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} />
            <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t('pages.employees.adding') : t('pages.employees.addButton')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

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
          <TextField label={t('fields.temporaryPassword')} value={credentials.temporaryPassword} readOnly />
          <div className="form-actions">
            <Button type="button" onClick={() => setCredentials(null)}>{t('common.close')}</Button>
          </div>
        </Modal>
      )}

      {documentsFor && <EmployeeDocumentsModal employee={documentsFor} onClose={() => setDocumentsFor(null)} />}
    </div>
  );
}
