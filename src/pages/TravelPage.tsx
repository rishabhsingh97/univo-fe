import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { employeeApi } from '../api/hr/employeeApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { ApprovalActions, Button, DataTable, EmployeeSelect, Modal, PageHeader, SelectField, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';

type TravelMode = 'FLIGHT' | 'TRAIN' | 'CAR' | 'BUS';
type TravelStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

interface TravelRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  destination: string;
  purpose: string;
  fromDate: string;
  toDate: string;
  modeOfTravel: TravelMode;
  estimatedCost: number;
  status: TravelStatus;
}

const MODES: TravelMode[] = ['FLIGHT', 'TRAIN', 'CAR', 'BUS'];

function seedTravel(): TravelRequest[] {
  return [
    { id: 1, employeeId: 0, employeeName: 'Arjun Kapoor', destination: 'Mumbai', purpose: 'Client visit', fromDate: '2026-09-02', toDate: '2026-09-04', modeOfTravel: 'FLIGHT', estimatedCost: 18000, status: 'PENDING' },
    { id: 2, employeeId: 0, employeeName: 'Sneha Iyer', destination: 'Pune', purpose: 'Vendor audit', fromDate: '2026-09-10', toDate: '2026-09-11', modeOfTravel: 'TRAIN', estimatedCost: 3500, status: 'APPROVED' },
  ];
}

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
  const { data: employees } = useQuery({ queryKey: ['employees', 'select'], queryFn: () => employeeApi.list(0, 200) });
  const canManage = hasPermission('finance.loan.write') || hasPermission('finance.reimbursement.write');

  const [requests, setRequests] = useState<TravelRequest[]>(seedTravel());
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<TravelForm>(emptyForm());

  const closeCreate = () => {
    setShowCreate(false);
    setForm(emptyForm());
  };

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    const employee = employees?.content.find((e) => e.id === form.employeeId);
    if (!employee) return;
    setRequests((prev) => [
      {
        id: Date.now(),
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        destination: form.destination,
        purpose: form.purpose,
        fromDate: form.fromDate,
        toDate: form.toDate,
        modeOfTravel: form.modeOfTravel,
        estimatedCost: Number(form.estimatedCost) || 0,
        status: 'PENDING',
      },
      ...prev,
    ]);
    closeCreate();
  };

  const setStatus = (id: number, status: TravelStatus) =>
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

  const columns: DataTableColumn<TravelRequest>[] = [
    { key: 'employee', header: t('fields.name'), render: (r) => r.employeeName },
    { key: 'destination', header: t('pages.travel.destination'), render: (r) => r.destination },
    { key: 'dates', header: t('pages.travel.dates'), render: (r) => `${r.fromDate} - ${r.toDate}` },
    { key: 'mode', header: t('pages.travel.mode'), render: (r) => r.modeOfTravel },
    { key: 'cost', header: t('pages.travel.estimatedCost'), render: (r) => r.estimatedCost.toLocaleString() },
    {
      key: 'status',
      header: t('fields.status'),
      render: (r) =>
        r.status === 'COMPLETED' ? (
          <span>{r.status}</span>
        ) : (
          <ApprovalActions status={r.status} canManage={canManage} onApprove={() => setStatus(r.id, 'APPROVED')} onReject={() => setStatus(r.id, 'REJECTED')} />
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.travel.title')}
        description={t('pages.travel.description')}
        actions={<Button onClick={() => setShowCreate(true)}>{t('pages.travel.addButton')}</Button>}
      />

      <DataTable
        columns={columns}
        rows={requests}
        getRowKey={(r) => r.id}
        extraActions={(r) =>
          r.status === 'APPROVED'
            ? [{ label: t('pages.travel.markCompleted'), onClick: () => setStatus(r.id, 'COMPLETED') }]
            : []
        }
        onDelete={(r) => setRequests((prev) => prev.filter((row) => row.id !== r.id))}
      />
      <p className="field-hint" style={{ marginTop: 12 }}>{t('pages.travel.mockNotice')}</p>

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
            <span className="field-hint" style={{ gridColumn: '1 / -1' }}>{t('pages.travel.mockNotice')}</span>
            <div className="form-actions">
              <Button type="submit" disabled={!form.employeeId}>{t('common.create')}</Button>
              <Button type="button" variant="secondary" onClick={closeCreate}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
