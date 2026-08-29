import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { useBranding } from '../context/BrandingContext';
import { domainApi } from '../api/public/domainApi';
import { AuthShell } from '../components/auth/AuthShell';
import { SocialSignIn } from '../components/auth/SocialSignIn';
import { Button, TextField } from '../components/ui';

type WorkspaceStatus = 'resolving' | 'found' | 'not-found';

export function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const { t } = useLocale();
  const { branding, loadBranding } = useBranding();
  const navigate = useNavigate();
  // No manual tenant entry: the workspace is always derived from the hostname (subdomain or a
  // client's custom domain), same as production routing already requires. 'not-found' covers
  // both an unrecognized host and a failed lookup - either way there's no workspace to sign into.
  const [workspaceStatus, setWorkspaceStatus] = useState<WorkspaceStatus>('resolving');
  const [tenantCode, setTenantCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    domainApi
      .resolveTenantByDomain(window.location.hostname)
      .then((resolved) => {
        if (cancelled) return;
        if (!resolved) {
          setWorkspaceStatus('not-found');
          return;
        }
        setTenantCode(resolved);
        setWorkspaceStatus('found');
        void loadBranding(resolved);
      })
      .catch(() => {
        if (!cancelled) setWorkspaceStatus('not-found');
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

  if (workspaceStatus === 'resolving') {
    return (
      <AuthShell>
        <p className="auth-card-subtitle">{t('login.resolvingWorkspace')}</p>
      </AuthShell>
    );
  }

  if (workspaceStatus === 'not-found') {
    return (
      <AuthShell>
        <h1>{t('login.workspaceNotFoundTitle')}</h1>
        <p className="auth-card-subtitle">{t('login.workspaceNotFoundBody')}</p>
        <div className="auth-links">
          <Link to="/signup">{t('login.signupLink')}</Link>
          <Link to="/platform/login">{t('login.platformAdminLink')}</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      {branding?.logoUrl && <img src={branding.logoUrl} alt={brandName} style={{ maxHeight: 40, marginBottom: 16 }} />}
      <h1>{brandName !== t('app.name') ? brandName : t('login.title')}</h1>
      <p className="auth-card-subtitle">{t('login.subtitle')}</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
      <SocialSignIn tenantCode={tenantCode} onGoogleCredential={handleGoogleCredential} googleEnabled={branding?.googleSignInEnabled ?? false} />

      <div className="auth-links">
        <Link to="/signup">{t('login.signupLink')}</Link>
        <Link to="/platform/login">{t('login.platformAdminLink')}</Link>
      </div>
    </AuthShell>
  );
}
