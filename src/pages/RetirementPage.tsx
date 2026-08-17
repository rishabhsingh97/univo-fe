import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { retirementApi } from '../api/hr/retirementApi';
import { useLocale } from '../context/LocaleContext';
import { useTimezone } from '../hooks/useTimezone';
import { Badge, Button, EmployeeSelect, Modal, PageHeader, PagedDataTable, TextField, statusTone } from '../components/ui';
import type { ActionMenuItem, DataTableColumn } from '../components/ui';
import type { RetirementRequest, RetirementResponse } from '../types/retirement';

function emptyForm(): RetirementRequest {
  return { employeeId: 0, retirementDate: new Date().toISOString().slice(0, 10), eligibleForGratuity: true, pensionScheme: '', remarks: '' };
}

export function RetirementPage() {
  const { t } = useLocale();
  const { formatDate } = useTimezone();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RetirementRequest>(emptyForm());
  const [showCreate, setShowCreate] = useState(false);

  // No real permission to gate on yet - Retirement has no backend (see api/hr/retirementApi.ts).
  const canManage = true;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['retirements'] });

  const createMutation = useMutation({
    mutationFn: (request: RetirementRequest) => retirementApi.create(request),
    onSuccess: () => { invalidate(); setForm(emptyForm()); setShowCreate(false); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: RetirementResponse['status'] }) => retirementApi.updateStatus(id, { status }),
    onSuccess: invalidate,
  });

  const columns: DataTableColumn<RetirementResponse>[] = [
    { key: 'employee', header: t('common.selectEmployee'), render: (r) => r.employeeName, sortKey: 'employeeName' },
    { key: 'retirementDate', header: t('fields.retirementDate'), render: (r) => formatDate(r.retirementDate), sortKey: 'retirementDate' },
    { key: 'gratuity', header: t('fields.gratuityEligible'), render: (r) => (r.eligibleForGratuity ? t('common.yes') : t('common.no')) },
    { key: 'pension', header: t('fields.pensionScheme'), render: (r) => r.pensionScheme ?? '-' },
    { key: 'status', header: t('fields.status'), render: (r) => <Badge tone={statusTone(r.status)}>{r.status.replace('_', ' ')}</Badge> },
  ];

  const extraActions = (r: RetirementResponse): ActionMenuItem[] => {
    if (!canManage) return [];
    if (r.status === 'PLANNED') {
      return [{ label: t('pages.retirement.startProcess'), onClick: () => statusMutation.mutate({ id: r.id, status: 'IN_PROCESS' }) }];
    }
    if (r.status === 'IN_PROCESS') {
      return [{ label: t('pages.retirement.markCompleted'), onClick: () => statusMutation.mutate({ id: r.id, status: 'COMPLETED' }) }];
    }
    return [];
  };

  return (
    <div>
      <PageHeader
        title={t('pages.retirement.title')}
        description={t('pages.retirement.description')}
        actions={canManage ? <Button onClick={() => setShowCreate(true)}>{t('pages.retirement.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.retirement.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createMutation.mutate(form); }} className="form-grid">
            <EmployeeSelect value={form.employeeId || ''} onChange={(id) => setForm({ ...form, employeeId: id })} required />
            <TextField label={t('fields.retirementDate')} type="date" value={form.retirementDate} onChange={(e) => setForm({ ...form, retirementDate: e.target.value })} required />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.eligibleForGratuity} onChange={(e) => setForm({ ...form, eligibleForGratuity: e.target.checked })} />
              {t('fields.gratuityEligible')}
            </label>
            <TextField label={t('fields.pensionScheme')} value={form.pensionScheme ?? ''} onChange={(e) => setForm({ ...form, pensionScheme: e.target.value })} />
            <TextField label={t('fields.remarks')} value={form.remarks ?? ''} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
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
        queryKey={['retirements']}
        fetchPage={retirementApi.list}
        getRowKey={(r) => r.id}
        extraActions={extraActions}
      />
    </div>
  );
}
