import { useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { domainApi } from '../api/public/domainApi';
import { useLocale } from '../context/LocaleContext';
import { Badge, Button, Card, TextField, statusTone } from '../components/ui';
import { SubdomainInput } from '../components/domain/SubdomainInput';
import type { TenantDomain } from '../types/domain';

const DOMAINS_QUERY_KEY = ['tenant-domains'];

/** Claim/change-subdomain form - every tenant gets one at signup now (see SignupStep2Page), so
 * this mainly covers changing it later, or setting one for a tenant created before that was
 * required. The submit button stays enabled the whole time (no separate "Check" click required
 * first) - the backend validates availability as part of claiming, and a specific error surfaces
 * right here if it isn't actually available. */
function SubdomainClaimForm({ onClaimed }: { onClaimed: () => void }) {
  const { t } = useLocale();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const claimMutation = useMutation({
    mutationFn: (subdomain: string) => domainApi.claimSubdomain(subdomain),
    onSuccess: () => {
      setError(null);
      onClaimed();
    },
    onError: (err) => {
      const backendMessage = isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined;
      setError(backendMessage ?? t('pages.domains.subdomainClaimError'));
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (value.trim()) claimMutation.mutate(value.trim().toLowerCase());
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <SubdomainInput label={t('pages.domains.subdomainLabel')} value={value} onChange={setValue} />
        </div>
        <Button type="submit" disabled={!value.trim() || claimMutation.isPending}>
          {claimMutation.isPending ? t('pages.domains.claiming') : t('pages.domains.claimSubdomain')}
        </Button>
      </div>
      {error && <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</div>}
    </form>
  );
}

/** No title of its own - only rendered as a tab inside AdministrationPage, same convention as
 * BrandingPage. */
export function DomainsPage() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [newDomain, setNewDomain] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const domainsQuery = useQuery({ queryKey: DOMAINS_QUERY_KEY, queryFn: domainApi.list });

  const addMutation = useMutation({
    mutationFn: (domain: string) => domainApi.addCustomDomain(domain),
    onSuccess: () => {
      setNewDomain('');
      setAddError(null);
      queryClient.invalidateQueries({ queryKey: DOMAINS_QUERY_KEY });
    },
    onError: () => setAddError(t('pages.domains.addError')),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: number) => domainApi.verify(id),
    onMutate: (id) => {
      setVerifyingId(id);
      setVerifyError(null);
    },
    onSuccess: (result) => {
      if (result.status !== 'ACTIVE') setVerifyError(t('pages.domains.verifyError'));
      queryClient.invalidateQueries({ queryKey: DOMAINS_QUERY_KEY });
    },
    onError: () => setVerifyError(t('pages.domains.verifyError')),
    onSettled: () => setVerifyingId(null),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => domainApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DOMAINS_QUERY_KEY }),
  });

  const handleAdd = (event: FormEvent) => {
    event.preventDefault();
    if (!newDomain.trim()) return;
    addMutation.mutate(newDomain.trim());
  };

  const handleRemove = (domain: TenantDomain) => {
    if (domain.id != null && window.confirm(t('pages.domains.confirmRemove'))) {
      removeMutation.mutate(domain.id);
    }
  };

  const subdomain = domainsQuery.data?.find((d) => d.type === 'SUBDOMAIN');
  const customDomains = domainsQuery.data?.filter((d) => d.type === 'CUSTOM') ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <h3 style={{ marginTop: 0 }}>{t('pages.domains.subdomainSectionTitle')}</h3>
        {!subdomain ? (
          <p>{t('pages.domains.subdomainNotConfigured')}</p>
        ) : subdomain.status === 'ACTIVE' && subdomain.domain ? (
          <p>
            <a href={`https://${subdomain.domain}`} target="_blank" rel="noreferrer">
              {subdomain.domain}
            </a>{' '}
            <Badge tone="success">{t('pages.domains.statusActive')}</Badge>
          </p>
        ) : (
          <SubdomainClaimForm onClaimed={() => queryClient.invalidateQueries({ queryKey: DOMAINS_QUERY_KEY })} />
        )}
      </Card>

      <Card>
        <h3 style={{ marginTop: 0 }}>{t('pages.domains.customDomainsSectionTitle')}</h3>

        {customDomains.length === 0 && <p>{t('pages.domains.customDomainsEmpty')}</p>}

        {customDomains.map((domain) => (
          <div
            key={domain.id}
            style={{
              display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <strong>{domain.domain}</strong>
              <Badge tone={statusTone(domain.status)}>
                {domain.status === 'ACTIVE' ? t('pages.domains.statusActive') : t('pages.domains.statusPending')}
              </Badge>
            </div>

            {domain.status !== 'ACTIVE' && (
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                <p>{t('pages.domains.dnsInstructions')}</p>
                <p>{t('pages.domains.dnsCname')}</p>
                {domain.dnsRecords.map((record, i) => (
                  <code key={i} style={{ display: 'block' }}>
                    {record.type} {record.host} → {record.value}
                  </code>
                ))}
              </div>
            )}

            {verifyingId === domain.id && verifyError && (
              <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>{verifyError}</div>
            )}

            <div className="row-actions">
              {domain.status !== 'ACTIVE' && (
                <Button
                  variant="secondary"
                  disabled={verifyMutation.isPending && verifyingId === domain.id}
                  onClick={() => domain.id != null && verifyMutation.mutate(domain.id)}
                >
                  {verifyMutation.isPending && verifyingId === domain.id
                    ? t('pages.domains.verifying')
                    : t('pages.domains.verify')}
                </Button>
              )}
              <Button variant="secondary" onClick={() => handleRemove(domain)} disabled={removeMutation.isPending}>
                {t('pages.domains.remove')}
              </Button>
            </div>
          </div>
        ))}

        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            <TextField
              label={t('pages.domains.addDomain')}
              placeholder={t('pages.domains.addDomainPlaceholder')}
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={addMutation.isPending || !newDomain.trim()}>
            {addMutation.isPending ? t('pages.domains.adding') : t('pages.domains.addDomain')}
          </Button>
        </form>
        {addError && <div style={{ color: 'var(--color-danger)', fontSize: 13, marginTop: 8 }}>{addError}</div>}
      </Card>
    </div>
  );
}
