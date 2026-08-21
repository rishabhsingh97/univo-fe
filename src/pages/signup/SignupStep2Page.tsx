import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { signupApi } from '../../api/public/signupApi';
import { useLocale } from '../../context/LocaleContext';
import { AuthShell } from '../../components/auth/AuthShell';
import { SignupStepper } from '../../components/auth/SignupStepper';
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

/** Step 2 of 3: company details. draftId comes from the URL (not component state) so reloading
 * this page, or coming back to it, resumes the same in-progress signup instead of starting
 * over. The workspace ID/tenantCode is no longer typed here - the backend generates a fully
 * random, unique one (see SignupDraftService.generateUniqueTenantCode) and the result is shown
 * to the visitor on step 3. */
export function SignupStep2Page() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { draftId } = useParams<{ draftId: string }>();
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draftId) return;
    setError(null);
    setSubmitting(true);
    try {
      await signupApi.step2(Number(draftId), { companyName, industry });
      navigate(`/signup/${draftId}/modules`);
    } catch {
      setError(t('signup.errorGeneric'));
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
