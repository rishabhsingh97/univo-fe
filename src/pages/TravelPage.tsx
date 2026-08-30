import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { travelApi } from '../api/hr/travelApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { ApprovalActions, Button, EmployeeSelect, Modal, PageHeader, PagedDataTable, SelectField, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { TravelMode, TravelRequest, TravelResponse, TravelStatus } from '../types/travel';

const MODES: TravelMode[] = ['FLIGHT', 'TRAIN', 'CAR', 'BUS'];

interface TravelForm {
  employeeId: number | '';
  destination: string;
  purpose: string;
  fromDate: string;
  toDate: string;
  modeOfTravel: TravelMode;
  estimatedCost: string;
}

function emptyForm(): TravelForm {
  return { employeeId: '', destination: '', purpose: '', fromDate: '', toDate: '', modeOfTravel: 'FLIGHT', estimatedCost: '' };
}

export function TravelPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canCreate = hasPermission('travel.write');
  const canApprove = hasPermission('travel.approve');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<TravelForm>(emptyForm());

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['travel'] });

  const closeCreate = () => {
    setShowCreate(false);
    setForm(emptyForm());
  };

  const createMutation = useMutation({
    mutationFn: (request: TravelRequest) => travelApi.create(request),
    onSuccess: () => { invalidate(); closeCreate(); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TravelStatus }) => travelApi.updateStatus(id, { status }),
    onSuccess: invalidate,
  });

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    if (!form.employeeId) return;
    createMutation.mutate({
      employeeId: form.employeeId,
      destination: form.destination,
      purpose: form.purpose || undefined,
      fromDate: form.fromDate,
      toDate: form.toDate,
      modeOfTravel: form.modeOfTravel,
      estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : null,
    });
  };

  const columns: DataTableColumn<TravelResponse>[] = [
    { key: 'employee', header: t('fields.name'), render: (r) => r.employeeName },
    { key: 'destination', header: t('pages.travel.destination'), render: (r) => r.destination },
    { key: 'dates', header: t('pages.travel.dates'), render: (r) => `${r.fromDate} - ${r.toDate}` },
    { key: 'mode', header: t('pages.travel.mode'), render: (r) => r.modeOfTravel },
    { key: 'cost', header: t('pages.travel.estimatedCost'), render: (r) => r.estimatedCost?.toLocaleString() ?? '-' },
    {
      key: 'status',
      header: t('fields.status'),
      render: (r) =>
        r.status === 'COMPLETED' ? (
          <span>{r.status}</span>
        ) : (
          <ApprovalActions
            status={r.status}
            canManage={canApprove}
            onApprove={() => statusMutation.mutate({ id: r.id, status: 'APPROVED' })}
            onReject={() => statusMutation.mutate({ id: r.id, status: 'REJECTED' })}
          />
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.travel.title')}
        description={t('pages.travel.description')}
        actions={canCreate && <Button onClick={() => setShowCreate(true)}>{t('pages.travel.addButton')}</Button>}
      />

      <PagedDataTable
        columns={columns}
        queryKey={['travel']}
        fetchPage={travelApi.list}
        getRowKey={(r) => r.id}
        extraActions={(r) =>
          canApprove && r.status === 'APPROVED'
            ? [{ label: t('pages.travel.markCompleted'), onClick: () => statusMutation.mutate({ id: r.id, status: 'COMPLETED' }) }]
            : []
        }
      />

      {showCreate && (
        <Modal title={t('pages.travel.addButton')} onClose={closeCreate}>
          <form onSubmit={handleCreate} className="form-grid">
            <EmployeeSelect value={form.employeeId} onChange={(id) => setForm({ ...form, employeeId: id })} required />
            <TextField label={t('pages.travel.destination')} value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required />
            <TextField label={t('fields.reason')} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
            <div className="field">
              <label className="field-label">{t('fields.startDate')}</label>
              <input type="date" className="input" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} required />
            </div>
            <div className="field">
              <label className="field-label">{t('fields.endDate')}</label>
              <input type="date" className="input" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} required />
            </div>
            <SelectField label={t('pages.travel.mode')} value={form.modeOfTravel} onChange={(e) => setForm({ ...form, modeOfTravel: e.target.value as TravelMode })}>
              {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </SelectField>
            <TextField label={t('pages.travel.estimatedCost')} type="number" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} />
            <div className="form-actions">
              <Button type="submit" disabled={!form.employeeId || createMutation.isPending}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={closeCreate}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
