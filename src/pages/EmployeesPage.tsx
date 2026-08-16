import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../api/hr/employeeApi';
import { designationApi } from '../api/hr/designationApi';
import { gradeApi } from '../api/hr/gradeApi';
import { useLocale } from '../context/LocaleContext';
import { useFieldLabels } from '../hooks/useFieldLabels';
import type { EmployeeRequest, EmployeeResponse, EmploymentType } from '../types/hr';
import { Badge, Button, Modal, PageHeader, PagedDataTable, SelectField, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';

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
  const queryClient = useQueryClient();
  const fieldLabels = useFieldLabels('Employee');
  const [form, setForm] = useState<EmployeeRequest>(emptyForm);
  const [showCreate, setShowCreate] = useState(false);

  // Full (unpaginated-ish) lists for the pickers below - independent of the table's own page,
  // since a manager/designation/grade selector needs every option, not just the visible page.
  const { data: allEmployees } = useQuery({ queryKey: ['employees', 'select'], queryFn: () => employeeApi.list(0, 200) });
  const { data: designations } = useQuery({ queryKey: ['designations', 'select'], queryFn: () => designationApi.list(0, 200) });
  const { data: grades } = useQuery({ queryKey: ['grades', 'select'], queryFn: () => gradeApi.list(0, 200) });

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

  const columns: DataTableColumn<EmployeeResponse>[] = [
    { key: 'code', header: fieldLabels.label('employeeCode', t('fields.employeeCode')), render: (e) => e.employeeCode, sortKey: 'employeeCode' },
    { key: 'name', header: t('fields.name'), render: (e) => `${e.firstName} ${e.lastName}`, sortKey: 'firstName' },
    { key: 'email', header: fieldLabels.label('email', t('fields.email')), render: (e) => e.email, sortKey: 'email' },
    { key: 'org', header: t('fields.orgUnit'), render: (e) => e.orgUnitName ?? '-' },
    { key: 'designation', header: fieldLabels.label('designation', t('fields.designation')), render: (e) => e.designationTitle ?? '-' },
    { key: 'grade', header: t('fields.grade'), render: (e) => e.gradeName ?? '-' },
    { key: 'manager', header: t('fields.manager'), render: (e) => e.managerName ?? '-' },
    {
      key: 'status',
      header: t('fields.status'),
      render: (e) => <Badge tone={statusTone(e.status)}>{e.status}</Badge>,
      sortKey: 'status',
    },
  ];

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
          <SelectField label={t('fields.grade')} value={form.gradeId ?? ''}
            onChange={(e) => setForm({ ...form, gradeId: e.target.value ? Number(e.target.value) : null })}>
            <option value="">{t('common.none')}</option>
            {grades?.content.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </SelectField>
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
      />
    </div>
  );
}
