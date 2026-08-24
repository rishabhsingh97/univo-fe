import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { exitApi } from '../api/hr/exitApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useTimezone } from '../hooks/useTimezone';
import { Badge, Button, EmployeeSelect, Modal, PageHeader, PagedDataTable, SelectField, TextField, statusTone } from '../components/ui';
import type { ActionMenuItem, DataTableColumn } from '../components/ui';
import type { ExitRequest, ExitResponse, ExitType } from '../types/exit';

const EXIT_TYPES: ExitType[] = ['RESIGNATION', 'TERMINATION'];

function emptyForm(): ExitRequest {
  const today = new Date().toISOString().slice(0, 10);
  return { employeeId: 0, exitType: 'RESIGNATION', resignationDate: today, lastWorkingDate: today, noticePeriodDays: 30, reason: '' };
}

export function ExitPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const { formatDate } = useTimezone();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ExitRequest>(emptyForm());
  const [showCreate, setShowCreate] = useState(false);
  const [viewing, setViewing] = useState<ExitResponse | null>(null);

  const canManage = hasPermission('exit.write');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['exits'] });

  const createMutation = useMutation({
    mutationFn: (request: ExitRequest) => exitApi.create(request),
    onSuccess: () => { invalidate(); setForm(emptyForm()); setShowCreate(false); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ExitResponse['status'] }) => exitApi.updateStatus(id, { status }),
    onSuccess: invalidate,
  });

  const clearanceMutation = useMutation({
    mutationFn: ({ exitId, itemId, cleared }: { exitId: number; itemId: number; cleared: boolean }) =>
      exitApi.updateClearanceItem(exitId, itemId, { cleared }),
    onSuccess: (updated) => { setViewing(updated); invalidate(); },
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => exitApi.complete(id),
    onSuccess: (updated) => { setViewing(updated); invalidate(); },
  });

  const columns: DataTableColumn<ExitResponse>[] = [
    { key: 'employee', header: t('common.selectEmployee'), render: (r) => r.employeeName, sortKey: 'employeeName' },
    { key: 'type', header: t('fields.exitType'), render: (r) => r.exitType },
    { key: 'resignationDate', header: t('fields.resignationDate'), render: (r) => formatDate(r.resignationDate) },
    { key: 'lastWorkingDate', header: t('fields.lastWorkingDate'), render: (r) => formatDate(r.lastWorkingDate) },
    {
      key: 'clearance',
      header: t('fields.clearanceItem'),
      render: (r) => `${r.clearanceItems.filter((i) => i.cleared).length}/${r.clearanceItems.length}`,
    },
    { key: 'status', header: t('fields.status'), render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>, sortKey: 'status' },
  ];

  const extraActions = (r: ExitResponse): ActionMenuItem[] =>
    r.status === 'PENDING' && canManage
      ? [
          { label: t('common.approve'), onClick: () => statusMutation.mutate({ id: r.id, status: 'APPROVED' }) },
          { label: t('common.reject'), onClick: () => statusMutation.mutate({ id: r.id, status: 'REJECTED' }) },
        ]
      : [];

  return (
    <div>
      <PageHeader
        title={t('pages.exit.title')}
        description={t('pages.exit.description')}
        actions={canManage ? <Button onClick={() => setShowCreate(true)}>{t('pages.exit.addButton')}</Button> : undefined}
      />

      {showCreate && (
        <Modal title={t('pages.exit.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createMutation.mutate(form); }} className="form-grid">
            <EmployeeSelect value={form.employeeId || ''} onChange={(id) => setForm({ ...form, employeeId: id })} required />
            <SelectField label={t('fields.exitType')} value={form.exitType} onChange={(e) => setForm({ ...form, exitType: e.target.value as ExitType })}>
              {EXIT_TYPES.map((ty) => <option key={ty} value={ty}>{ty}</option>)}
            </SelectField>
            <TextField label={t('fields.resignationDate')} type="date" value={form.resignationDate} onChange={(e) => setForm({ ...form, resignationDate: e.target.value })} required />
            <TextField label={t('fields.lastWorkingDate')} type="date" value={form.lastWorkingDate} onChange={(e) => setForm({ ...form, lastWorkingDate: e.target.value })} required />
            <TextField label={t('fields.noticePeriodDays')} type="number" value={form.noticePeriodDays} onChange={(e) => setForm({ ...form, noticePeriodDays: Number(e.target.value) })} required />
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
        queryKey={['exits']}
        fetchPage={exitApi.list}
        getRowKey={(r) => r.id}
        onView={(r) => setViewing(r)}
        extraActions={extraActions}
      />

      {viewing && (
        <Modal title={`${viewing.employeeName} — ${t('pages.exit.clearanceTitle')}`} onClose={() => setViewing(null)}>
          <div className="form-grid">
            {viewing.clearanceItems.map((item) => (
              <label key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={item.cleared}
                  disabled={viewing.status !== 'APPROVED' || !canManage}
                  onChange={(e) => clearanceMutation.mutate({ exitId: viewing.id, itemId: item.id, cleared: e.target.checked })}
                />
                <span>
                  {item.label}
                  {item.remarks && <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{item.remarks}</div>}
                </span>
              </label>
            ))}
            {viewing.status === 'APPROVED' && canManage && (
              <div className="form-actions">
                <Button
                  type="button"
                  disabled={completeMutation.isPending || viewing.clearanceItems.some((i) => !i.cleared)}
                  onClick={() => completeMutation.mutate(viewing.id)}
                >
                  {t('pages.exit.markComplete')}
                </Button>
              </div>
            )}
            {viewing.status !== 'APPROVED' && (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                {viewing.status === 'COMPLETED' ? t('pages.exit.alreadyComplete') : t('pages.exit.notYetApproved')}
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
