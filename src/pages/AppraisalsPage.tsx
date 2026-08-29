import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appraisalApi } from '../api/hr/performanceApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, EmployeeSelect, Modal, PageHeader, PagedDataTable, SelectField, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { AppraisalRequest, AppraisalResponse, AppraisalStatus } from '../types/performance';

const APPRAISAL_STATUSES: AppraisalStatus[] = ['DRAFT', 'SUBMITTED', 'ACKNOWLEDGED'];

function emptyAppraisal(): AppraisalRequest {
  return { employeeId: 0, reviewCycle: '', rating: 3, reviewerComments: '', status: 'DRAFT' };
}

export function AppraisalsPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canManage = hasPermission('performance.write');

  const [appraisalForm, setAppraisalForm] = useState<AppraisalRequest>(emptyAppraisal());
  const [showAppraisalCreate, setShowAppraisalCreate] = useState(false);

  const createAppraisal = useMutation({
    mutationFn: (request: AppraisalRequest) => appraisalApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appraisals'] });
      setAppraisalForm(emptyAppraisal());
      setShowAppraisalCreate(false);
    },
  });

  const appraisalColumns: DataTableColumn<AppraisalResponse>[] = [
    { key: 'employee', header: t('common.selectEmployee'), render: (r) => r.employeeName, sortKey: 'employeeName' },
    { key: 'cycle', header: t('fields.reviewCycle'), render: (r) => r.reviewCycle, sortKey: 'reviewCycle' },
    { key: 'rating', header: t('fields.rating'), render: (r) => '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) },
    { key: 'status', header: t('fields.status'), render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.appraisals.title')}
        description={t('pages.appraisals.description')}
        actions={canManage && <Button onClick={() => setShowAppraisalCreate(true)}>{t('pages.appraisals.addAppraisal')}</Button>}
      />

      <PagedDataTable columns={appraisalColumns} queryKey={['appraisals']} fetchPage={appraisalApi.list} getRowKey={(r) => r.id} />

      {showAppraisalCreate && (
        <Modal title={t('pages.appraisals.createAppraisalTitle')} onClose={() => setShowAppraisalCreate(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createAppraisal.mutate(appraisalForm); }} className="form-grid">
            <EmployeeSelect value={appraisalForm.employeeId || ''} onChange={(id) => setAppraisalForm({ ...appraisalForm, employeeId: id })} required />
            <TextField label={t('fields.reviewCycle')} placeholder="H1 2026" value={appraisalForm.reviewCycle} onChange={(e) => setAppraisalForm({ ...appraisalForm, reviewCycle: e.target.value })} required />
            <SelectField label={t('fields.rating')} value={appraisalForm.rating} onChange={(e) => setAppraisalForm({ ...appraisalForm, rating: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </SelectField>
            <TextField label={t('fields.reviewerComments')} value={appraisalForm.reviewerComments ?? ''} onChange={(e) => setAppraisalForm({ ...appraisalForm, reviewerComments: e.target.value })} />
            <SelectField label={t('fields.status')} value={appraisalForm.status} onChange={(e) => setAppraisalForm({ ...appraisalForm, status: e.target.value as AppraisalStatus })}>
              {APPRAISAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </SelectField>
            <div className="form-actions">
              <Button type="submit" disabled={createAppraisal.isPending || !appraisalForm.employeeId}>
                {createAppraisal.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowAppraisalCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
