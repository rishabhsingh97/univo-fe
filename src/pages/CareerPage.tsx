import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { careerApi } from '../api/hr/careerApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useTimezone } from '../hooks/useTimezone';
import { Badge, Button, EmployeeSelect, Modal, PageHeader, PagedDataTable, SelectField, TextField, statusTone } from '../components/ui';
import type { ActionMenuItem, DataTableColumn } from '../components/ui';
import type { CareerActionRequest, CareerActionResponse, CareerActionType } from '../types/career';

const ACTION_TYPES: CareerActionType[] = ['PROMOTION', 'INCREMENT', 'TRANSFER'];

const VALUE_HINT: Record<CareerActionType, string> = {
  PROMOTION: 'e.g. Senior Engineer',
  INCREMENT: 'e.g. ₹98,000 / month',
  TRANSFER: 'e.g. Pune — Engineering',
};

function emptyForm(): CareerActionRequest {
  return { employeeId: 0, actionType: 'PROMOTION', effectiveDate: new Date().toISOString().slice(0, 10), previousValue: '', newValue: '', reason: '' };
}

export function CareerPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const { formatDate } = useTimezone();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CareerActionRequest>(emptyForm());
  const [showCreate, setShowCreate] = useState(false);

  const canManage = hasPermission('career.write');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['career-actions'] });

  const createMutation = useMutation({
    mutationFn: (request: CareerActionRequest) => careerApi.create(request),
    onSuccess: () => { invalidate(); setForm(emptyForm()); setShowCreate(false); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: CareerActionResponse['status'] }) => careerApi.updateStatus(id, { status }),
    onSuccess: invalidate,
  });

  const columns: DataTableColumn<CareerActionResponse>[] = [
    { key: 'employee', header: t('common.selectEmployee'), render: (r) => r.employeeName, sortKey: 'employeeName' },
    { key: 'type', header: t('fields.actionType'), render: (r) => r.actionType },
    { key: 'effectiveDate', header: t('fields.effectiveDate'), render: (r) => formatDate(r.effectiveDate) },
    {
      key: 'change',
      header: t('fields.change'),
      render: (r) => (r.previousValue ? `${r.previousValue} → ${r.newValue}` : r.newValue),
    },
    { key: 'status', header: t('fields.status'), render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>, sortKey: 'status' },
  ];

  const extraActions = (r: CareerActionResponse): ActionMenuItem[] =>
    r.status === 'PENDING' && canManage
      ? [
          { label: t('common.approve'), onClick: () => statusMutation.mutate({ id: r.id, status: 'APPROVED' }) },
          { label: t('common.reject'), onClick: () => statusMutation.mutate({ id: r.id, status: 'REJECTED' }) },
        ]
      : [];

  return (
    <div>
      <PageHeader
        title={t('pages.career.title')}
        description={t('pages.career.description')}
        actions={canManage ? <Button onClick={() => setShowCreate(true)}>{t('pages.career.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.career.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createMutation.mutate(form); }} className="form-grid">
            <EmployeeSelect value={form.employeeId || ''} onChange={(id) => setForm({ ...form, employeeId: id })} required />
            <SelectField label={t('fields.actionType')} value={form.actionType} onChange={(e) => setForm({ ...form, actionType: e.target.value as CareerActionType })}>
              {ACTION_TYPES.map((ty) => <option key={ty} value={ty}>{ty}</option>)}
            </SelectField>
            <TextField label={t('fields.effectiveDate')} type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} required />
            <TextField label={t('fields.previousValue')} placeholder={VALUE_HINT[form.actionType]} value={form.previousValue ?? ''} onChange={(e) => setForm({ ...form, previousValue: e.target.value })} />
            <TextField label={t('fields.newValue')} placeholder={VALUE_HINT[form.actionType]} value={form.newValue} onChange={(e) => setForm({ ...form, newValue: e.target.value })} required />
            <TextField label={t('fields.reason')} value={form.reason ?? ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending || !form.employeeId}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      <PagedDataTable
        columns={columns}
        queryKey={['career-actions']}
        fetchPage={careerApi.list}
        getRowKey={(r) => r.id}
        extraActions={extraActions}
      />
    </div>
  );
}
