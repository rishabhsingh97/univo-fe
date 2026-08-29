import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { referralApi } from '../api/hr/referralApi';
import { jobPostingApi } from '../api/recruitment/jobPostingApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { ApprovalActions, Button, Modal, PageHeader, PagedDataTable, SelectField, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { ReferralRequest, ReferralResponse } from '../types/hr';
import type { RequestStatus } from '../types/finance';

function emptyForm(): ReferralRequest {
  return { jobPostingId: 0, candidateName: '', candidateEmail: '', candidatePhone: '', notes: '' };
}

export function ReferralsPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const canManage = hasPermission('referral.write');

  const { data: jobPostings } = useQuery({ queryKey: ['job-postings', 'select'], queryFn: () => jobPostingApi.list(0, 200) });

  const [form, setForm] = useState<ReferralRequest>(emptyForm());
  const [showCreate, setShowCreate] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['referrals'] });

  const createMutation = useMutation({
    mutationFn: (request: ReferralRequest) => referralApi.create(request),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm());
      setShowCreate(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: RequestStatus }) => referralApi.updateStatus(id, { status }),
    onSuccess: invalidate,
  });

  const columns: DataTableColumn<ReferralResponse>[] = [
    { key: 'candidate', header: t('fields.name'), render: (r) => r.candidateName },
    { key: 'email', header: t('fields.email'), render: (r) => r.candidateEmail },
    { key: 'job', header: t('pages.referrals.job'), render: (r) => r.jobTitle },
    { key: 'referrer', header: t('pages.referrals.referredBy'), render: (r) => r.employeeName },
    {
      key: 'status',
      header: t('fields.status'),
      render: (r) => (
        <ApprovalActions
          status={r.status}
          canManage={canManage}
          onApprove={() => statusMutation.mutate({ id: r.id, status: 'APPROVED' })}
          onReject={() => statusMutation.mutate({ id: r.id, status: 'REJECTED' })}
        />
      ),
      sortKey: 'status',
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.referrals.title')}
        description={t('pages.referrals.description')}
        actions={<Button onClick={() => setShowCreate(true)}>{t('pages.referrals.addButton')}</Button>}
      />

      <PagedDataTable columns={columns} queryKey={['referrals']} fetchPage={referralApi.list} getRowKey={(r) => r.id} />

      {showCreate && (
        <Modal title={t('pages.referrals.addButton')} onClose={() => setShowCreate(false)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              createMutation.mutate(form);
            }}
            className="form-grid"
          >
            <SelectField
              label={t('pages.referrals.job')}
              value={form.jobPostingId || ''}
              onChange={(e) => setForm({ ...form, jobPostingId: Number(e.target.value) })}
              required
            >
              <option value="">{t('common.selectOption')}</option>
              {jobPostings?.content.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </SelectField>
            <TextField
              label={t('fields.name')}
              value={form.candidateName}
              onChange={(e) => setForm({ ...form, candidateName: e.target.value })}
              required
            />
            <TextField
              label={t('fields.email')}
              type="email"
              value={form.candidateEmail}
              onChange={(e) => setForm({ ...form, candidateEmail: e.target.value })}
              required
            />
            <TextField
              label={t('fields.phone')}
              value={form.candidatePhone ?? ''}
              onChange={(e) => setForm({ ...form, candidatePhone: e.target.value })}
            />
            <TextField
              label={t('pages.referrals.notes')}
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending || !form.jobPostingId}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
