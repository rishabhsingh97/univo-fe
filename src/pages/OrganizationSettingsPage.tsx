import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '../api/hr/companyApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Card, Button, TextField, Spinner } from '../components/ui';
import type { CompanyRequest, CompanyResponse } from '../types/orgStructure';

function toForm(company: CompanyResponse | undefined): CompanyRequest {
  return { name: company?.name ?? '', code: company?.code ?? '' };
}

/** No title of its own - only rendered as a tab inside AdministrationPage, whose tab label
 * already says "Organization". Company is a single implicit record per tenant (see
 * CompanyController) - this is the only place it's ever edited, unlike the old multi-row
 * Companies tab that used to live in OrgUnitsPage. Its `code` is also the prefix every
 * Branch/Department/Job Category composite code is built from. */
export function OrganizationSettingsPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canWrite = hasPermission('hr.company.write');

  const { data: company, isLoading } = useQuery({ queryKey: ['companies', 'current'], queryFn: () => companyApi.getCurrent() });
  const [form, setForm] = useState<CompanyRequest>(() => toForm(company));

  useEffect(() => {
    setForm(toForm(company));
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: (request: CompanyRequest) => companyApi.updateCurrent(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    saveMutation.mutate(form);
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div>
      <Card>
        <form onSubmit={handleSubmit} className="form-grid">
          <TextField label={t('fields.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required disabled={!canWrite} />
          <TextField label={t('fields.code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required disabled={!canWrite} />
          <span className="field-hint">{t('pages.organizationSettings.codeHint')}</span>
          {canWrite && (
            <div className="form-actions">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? t('common.saving') : t('common.save')}
              </Button>
              {saveMutation.isSuccess && <span>{t('pages.branding.saved')}</span>}
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
