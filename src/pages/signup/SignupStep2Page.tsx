import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { signupApi } from '../../api/public/signupApi';
import { domainApi } from '../../api/public/domainApi';
import { useLocale } from '../../context/LocaleContext';
import { AuthShell } from '../../components/auth/AuthShell';
import { SignupStepper } from '../../components/auth/SignupStepper';
import { SubdomainInput } from '../../components/domain/SubdomainInput';
import { Button, SelectField, TextField } from '../../components/ui';

/** Same industry list as univo-landing's /customers page, for consistency across the two
 * properties. */
const INDUSTRIES = [
  'IT & ITES',
  'Manufacturing',
  'Retail & D2C',
  'Healthcare',
  'BFSI',
  'Logistics',
  'Professional services',
  'Other',
];

/** Step 2 of 3: company details plus the tenant's public subdomain. The subdomain field
 * auto-fills with an available suggestion derived from the company name as the visitor types
 * (Instagram-username-style: slug, then slug+1, slug+2, ... on collision - see
 * TenantDomainController.suggestSubdomain), so there's nothing to think up from scratch - but
 * it's still a real, editable field with live availability feedback (red text if what's shown
 * isn't actually available), not a value silently assigned behind the scenes. Once the visitor
 * edits it themselves, the auto-suggestion stops overwriting their choice. The internal
 * tenant_code is still never typed here - the backend generates a fully random, opaque one for
 * that (see SignupDraftService.generateUniqueTenantCode). */
export function SignupStep2Page() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { draftId } = useParams<{ draftId: string }>();
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [subdomainEdited, setSubdomainEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Re-suggests as the visitor types the company name, but only until they touch the subdomain
  // field themselves - once subdomainEdited is true, their own choice is never overwritten.
  useEffect(() => {
    if (subdomainEdited || !companyName.trim()) return;
    const handle = setTimeout(() => {
      domainApi
        .suggestSubdomain(companyName.trim())
        .then((suggested) => setSubdomain(suggested))
        .catch(() => {});
    }, 500);
    return () => clearTimeout(handle);
  }, [companyName, subdomainEdited]);

  // Continue stays enabled the whole time - clicking it runs the availability check itself
  // (rather than gating the button on a separate, easy-to-miss "Check" click first) and gives a
  // specific, fixable error right here if the current value isn't actually available.
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draftId) return;
    setError(null);
    setSubmitting(true);
    try {
      const available = await domainApi.checkSubdomainAvailability(subdomain.trim().toLowerCase());
      if (!available) {
        setError(t('signup.subdomainNotAvailable'));
        return;
      }
      await signupApi.step2(Number(draftId), { companyName, industry, subdomain });
      navigate(`/signup/${draftId}/modules`);
    } catch (err) {
      const backendMessage = isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined;
      setError(backendMessage ?? t('signup.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <h1>{t('signup.title')}</h1>
      <SignupStepper current={2} />
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <TextField
          label={t('signup.companyName')}
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />
        <SelectField label={t('signup.industry')} value={industry} onChange={(e) => setIndustry(e.target.value)} required>
          <option value="" disabled>
            {t('signup.industryPlaceholder')}
          </option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </SelectField>
        <SubdomainInput
          label={t('signup.subdomainLabel')}
          value={subdomain}
          onChange={(value) => {
            setSubdomain(value);
            setSubdomainEdited(true);
          }}
        />
        {error && <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</div>}
        <Button type="submit" disabled={submitting}>
          {submitting ? t('signup.submitting') : t('signup.continueButton')}
        </Button>
      </form>
      <div className="auth-links">
        <Link to="/login">{t('signup.loginLink')}</Link>
      </div>
    </AuthShell>
  );
}
