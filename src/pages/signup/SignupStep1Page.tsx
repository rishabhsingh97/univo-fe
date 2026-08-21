import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signupApi } from '../../api/public/signupApi';
import { useLocale } from '../../context/LocaleContext';
import { AuthShell } from '../../components/auth/AuthShell';
import { SignupStepper } from '../../components/auth/SignupStepper';
import { Button, TextField } from '../../components/ui';

/** Step 1 of 3: who's signing up. Persists to signup_drafts as soon as this step is submitted -
 * the wizard never holds this in memory-only state waiting for a final "Create workspace"
 * click. */
export function SignupStep1Page() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { draftId } = await signupApi.step1({ fullName, email, password });
      navigate(`/signup/${draftId}/company`);
    } catch {
      setError(t('signup.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <h1>{t('signup.title')}</h1>
      <SignupStepper current={1} />
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <TextField label={t('signup.fullName')} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <TextField
          label={t('signup.adminEmail')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label={t('signup.adminPassword')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: -8 }}>{t('signup.passwordHint')}</div>
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
