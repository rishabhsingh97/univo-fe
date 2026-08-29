import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../api/hr/employeeApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import type { GenerateCredentialsResponse } from '../types/hr';
import { Badge, Button, Card, Modal, PageHeader, PagedDataTable, Spinner, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { EmployeeResponse } from '../types/hr';
import { EmployeeDocumentsSection } from '../components/EmployeeDocumentsSection';

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const employeeId = Number(id);
  const navigate = useNavigate();
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [credentials, setCredentials] = useState<GenerateCredentialsResponse | null>(null);

  const canManageCredentials = hasPermission('hr.employee.credentials');
  const canViewDocuments = hasPermission('hr.document.read');

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employees', employeeId],
    queryFn: () => employeeApi.getById(employeeId),
    enabled: Number.isFinite(employeeId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    queryClient.invalidateQueries({ queryKey: ['employees', employeeId] });
  };

  const generateCredentialsMutation = useMutation({
    mutationFn: () => employeeApi.generateCredentials(employeeId),
    onSuccess: (response) => {
      invalidate();
      setCredentials(response);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => employeeApi.resetPassword(employeeId),
    onSuccess: (response) => {
      invalidate();
      setCredentials(response);
    },
  });

  const directReportColumns: DataTableColumn<EmployeeResponse>[] = [
    { key: 'code', header: t('fields.employeeCode'), render: (e) => e.employeeCode },
    { key: 'name', header: t('fields.name'), render: (e) => `${e.firstName} ${e.lastName}` },
    { key: 'designation', header: t('fields.designation'), render: (e) => e.designationTitle ?? '-' },
    { key: 'status', header: t('fields.status'), render: (e) => <Badge tone={statusTone(e.status)}>{e.status}</Badge> },
  ];

  if (isLoading || !employee) {
    return <Spinner />;
  }

  return (
    <div>
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        description={employee.designationTitle ?? employee.employeeCode}
        actions={<Badge tone={statusTone(employee.status)}>{employee.status}</Badge>}
      />

      <Card>
        <dl className="detail-grid">
          <div className="detail-row"><dt>{t('fields.employeeCode')}</dt><dd>{employee.employeeCode}</dd></div>
          <div className="detail-row"><dt>{t('fields.email')}</dt><dd>{employee.email}</dd></div>
          <div className="detail-row"><dt>{t('fields.orgUnit')}</dt><dd>{employee.orgUnitName ?? '-'}</dd></div>
          <div className="detail-row"><dt>{t('fields.designation')}</dt><dd>{employee.designationTitle ?? '-'}</dd></div>
          <div className="detail-row"><dt>{t('fields.grade')}</dt><dd>{employee.gradeName ?? '-'}</dd></div>
          <div className="detail-row">
            <dt>{t('fields.manager')}</dt>
            <dd>{employee.managerId ? <Link to={`/employees/${employee.managerId}`}>{employee.managerName}</Link> : '-'}</dd>
          </div>
          <div className="detail-row"><dt>{t('fields.employmentType')}</dt><dd>{employee.employmentType.replace('_', ' ')}</dd></div>
          <div className="detail-row"><dt>{t('fields.dateOfJoining')}</dt><dd>{employee.dateOfJoining}</dd></div>
          <div className="detail-row"><dt>{t('fields.pan')}</dt><dd>{employee.pan ?? '-'}</dd></div>
          <div className="detail-row"><dt>{t('fields.uan')}</dt><dd>{employee.uan ?? '-'}</dd></div>
          <div className="detail-row">
            <dt>{t('fields.linkedinUrl')}</dt>
            <dd>{employee.linkedinUrl ? <a href={employee.linkedinUrl} target="_blank" rel="noreferrer">{employee.linkedinUrl}</a> : '-'}</dd>
          </div>
          <div className="detail-row">
            <dt>{t('fields.githubUrl')}</dt>
            <dd>{employee.githubUrl ? <a href={employee.githubUrl} target="_blank" rel="noreferrer">{employee.githubUrl}</a> : '-'}</dd>
          </div>
        </dl>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>{t('fields.access')}</h3>
        {employee.hasUserAccount ? (
          <div className="row-actions">
            <Badge tone="success">{employee.email}</Badge>
            {canManageCredentials && (
              <Button
                variant="secondary"
                disabled={resetPasswordMutation.isPending}
                onClick={() => resetPasswordMutation.mutate()}
              >
                {t('pages.employees.resetPassword')}
              </Button>
            )}
          </div>
        ) : canManageCredentials ? (
          <Button
            disabled={generateCredentialsMutation.isPending}
            onClick={() => generateCredentialsMutation.mutate()}
          >
            {t('pages.employees.generateCredentials')}
          </Button>
        ) : (
          <Badge tone="neutral">{t('pages.employees.noAccount')}</Badge>
        )}
      </Card>

      {canViewDocuments && (
        <Card style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>{t('pages.employeeDocuments.title')}</h3>
          <EmployeeDocumentsSection employeeId={employeeId} />
        </Card>
      )}

      <Card style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>{t('pages.employees.directReports')}</h3>
        <PagedDataTable
          columns={directReportColumns}
          queryKey={['employees', employeeId, 'direct-reports']}
          fetchPage={(page, size) => employeeApi.directReports(employeeId, page, size)}
          getRowKey={(e) => e.id}
          pageSize={10}
          emptyMessage={t('pages.employees.noDirectReports')}
          onView={(e) => navigate(`/employees/${e.id}`)}
        />
      </Card>

      {credentials && (
        <Modal title={t('pages.employees.credentialsTitle')} onClose={() => setCredentials(null)}>
          <p>{t('pages.employees.credentialsHint')}</p>
          <TextField label={t('fields.email')} value={credentials.email} readOnly />
          <div className="form-actions">
            <Button type="button" onClick={() => setCredentials(null)}>{t('common.close')}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
