import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../api/hr/employeeApi';
import { useLocale } from '../context/LocaleContext';
import { useFieldLabels } from '../hooks/useFieldLabels';
import type { EmployeeRequest } from '../types/hr';
import { Badge, Button, Card, DataTable, PageHeader, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { EmployeeResponse } from '../types/hr';

const emptyForm: EmployeeRequest = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  email: '',
  dateOfJoining: new Date().toISOString().slice(0, 10),
};

export function EmployeesPage() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const fieldLabels = useFieldLabels('Employee');
  const [form, setForm] = useState<EmployeeRequest>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeApi.list(0, 50),
  });

  const createMutation = useMutation({
    mutationFn: (request: EmployeeRequest) => employeeApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setForm(emptyForm);
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate(form);
  };

  const columns: DataTableColumn<EmployeeResponse>[] = [
    { key: 'code', header: fieldLabels.label('employeeCode', t('fields.employeeCode')), render: (e) => e.employeeCode },
    { key: 'name', header: t('fields.name'), render: (e) => `${e.firstName} ${e.lastName}` },
    { key: 'email', header: fieldLabels.label('email', t('fields.email')), render: (e) => e.email },
    { key: 'org', header: t('fields.orgUnit'), render: (e) => e.orgUnitName ?? '-' },
    { key: 'status', header: t('fields.status'), render: (e) => <Badge tone={statusTone(e.status)}>{e.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader title={t('pages.employees.title')} description={t('pages.employees.description')} />

      <Card style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
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
            <TextField label={fieldLabels.label('designation', t('fields.designation'))} value={form.designation ?? ''}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              required={fieldLabels.isRequired('designation', false)} readOnly={fieldLabels.isReadOnly('designation')} />
          )}
          {!fieldLabels.isHidden('dateOfJoining') && (
            <TextField label={fieldLabels.label('dateOfJoining', t('fields.dateOfJoining'))} type="date" value={form.dateOfJoining}
              onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })}
              required={fieldLabels.isRequired('dateOfJoining', true)} readOnly={fieldLabels.isReadOnly('dateOfJoining')} />
          )}
          <div style={{ gridColumn: '1 / -1' }}>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t('pages.employees.adding') : t('pages.employees.addButton')}
            </Button>
          </div>
        </form>
      </Card>

      <DataTable
        columns={columns}
        rows={data?.content ?? []}
        isLoading={isLoading}
        getRowKey={(e) => e.id}
        emptyMessage={t('pages.employees.empty')}
      />
    </div>
  );
}
