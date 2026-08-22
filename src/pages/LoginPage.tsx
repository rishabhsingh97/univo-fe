import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { useBranding } from '../context/BrandingContext';
import { domainApi } from '../api/public/domainApi';
import { AuthShell } from '../components/auth/AuthShell';
import { SocialSignIn } from '../components/auth/SocialSignIn';
import { Button, TextField } from '../components/ui';

export function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const { t } = useLocale();
  const { branding, loadBranding } = useBranding();
  const navigate = useNavigate();
  const [tenantCode, setTenantCode] = useState('demo');
  const [tenantCodeFromHost, setTenantCodeFromHost] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // A tenant reached through their own {code}.<base domain> subdomain or a custom domain
  // already knows which workspace they're in - resolve it from the hostname instead of making
  // them type it. Resolves to null (silently) on the bare platform domain / localhost, where
  // the field stays editable exactly as before.
  useEffect(() => {
    let cancelled = false;
    domainApi.resolveTenantByDomain(window.location.hostname).then((resolved) => {
      if (cancelled || !resolved) return;
      setTenantCode(resolved);
      setTenantCodeFromHost(true);
      void loadBranding(resolved);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ tenantCode, email, password });
      navigate('/');
    } catch {
      setError(t('login.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleCredential = async (idToken: string, currentTenantCode: string) => {
    setError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle({ tenantCode: currentTenantCode, idToken });
      navigate('/');
    } catch {
      setError(t('login.googleError'));
    } finally {
      setSubmitting(false);
    }
  };

  const brandName = branding?.companyName ?? t('app.name');

  return (
    <AuthShell>
      {branding?.logoUrl && <img src={branding.logoUrl} alt={brandName} style={{ maxHeight: 40, marginBottom: 16 }} />}
      <h1>{brandName !== t('app.name') ? brandName : t('login.title')}</h1>
      <p className="auth-card-subtitle">{t('login.subtitle')}</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!tenantCodeFromHost && (
          <TextField
            label={t('login.tenantCode')}
            value={tenantCode}
            onChange={(e) => setTenantCode(e.target.value)}
            onBlur={() => tenantCode && loadBranding(tenantCode)}
            required
          />
        )}
        <TextField label={t('login.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <TextField
          label={t('login.password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</div>}
        <Button type="submit" disabled={submitting}>
          {submitting ? t('login.signingIn') : t('login.signIn')}
        </Button>
      </form>

      <div className="auth-divider">
        <span>{t('login.orContinueWith')}</span>
      </div>
      <SocialSignIn tenantCode={tenantCode} onGoogleCredential={handleGoogleCredential} />

      <div className="auth-links">
        <Link to="/signup">{t('login.signupLink')}</Link>
        <Link to="/platform/login">{t('login.platformAdminLink')}</Link>
      </div>
    </AuthShell>
  );
}
