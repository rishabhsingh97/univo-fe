import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { useBranding } from '../context/BrandingContext';
import { domainApi } from '../api/public/domainApi';
import { passwordSetupApi } from '../api/public/passwordSetupApi';
import { AuthShell } from '../components/auth/AuthShell';
import { Button, TextField } from '../components/ui';

type WorkspaceStatus = 'resolving' | 'found' | 'not-found';

/** Landing page for the one-time "set your password" link emailed on new-user creation,
 * employee credential generation, or an admin-triggered reset (PasswordSetupService on the
 * backend) - replaces an admin having to relay a temporary password out of band. Resolves the
 * workspace from the hostname exactly like LoginPage (the link always points at the tenant's own
 * subdomain/custom domain - see TenantDomainService.resolvePrimaryOrigin), then on success signs
 * the recipient straight in via the same session-from-response path the signup wizard uses,
 * skipping a separate login step since clicking the link already proves the account is theirs. */
export function SetPasswordPage() {
  const { setSessionFromLoginResponse } = useAuth();
  const { t } = useLocale();
  const { branding, loadBranding } = useBranding();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [workspaceStatus, setWorkspaceStatus] = useState<WorkspaceStatus>('resolving');
  const [tenantCode, setTenantCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    if (newPassword !== confirmPassword) {
      setError(t('setPassword.mismatch'));
      return;
    }
    setSubmitting(true);
    try {
      const response = await passwordSetupApi.redeem({ tenantCode, token, newPassword });
      setSessionFromLoginResponse(tenantCode, response);
      navigate('/');
    } catch (err) {
      const message = axios.isAxiosError(err) ? (err.response?.data as { message?: string })?.message : undefined;
      setError(message ?? t('setPassword.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const brandName = branding?.companyName ?? t('app.name');

  if (workspaceStatus === 'resolving') {
    return (
      <AuthShell>
        <p className="auth-card-subtitle">{t('setPassword.resolvingWorkspace')}</p>
      </AuthShell>
    );
  }

  if (workspaceStatus === 'not-found') {
    return (
      <AuthShell>
        <h1>{t('login.workspaceNotFoundTitle')}</h1>
        <p className="auth-card-subtitle">{t('login.workspaceNotFoundBody')}</p>
      </AuthShell>
    );
  }

  if (!token) {
    return (
      <AuthShell>
        <h1>{t('setPassword.title')}</h1>
        <p className="auth-card-subtitle">{t('setPassword.missingToken')}</p>
        <div className="auth-links">
          <Link to="/login">{t('login.title')}</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      {branding?.logoUrl && <img src={branding.logoUrl} alt={brandName} style={{ maxHeight: 40, marginBottom: 16 }} />}
      <h1>{brandName !== t('app.name') ? brandName : t('setPassword.title')}</h1>
      <p className="auth-card-subtitle">{t('setPassword.subtitle')}</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <TextField
          label={t('fields.newPassword')}
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />
        <TextField
          label={t('fields.confirmPassword')}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
        />
        {error && <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</div>}
        <Button type="submit" disabled={submitting}>
          {submitting ? t('setPassword.submitting') : t('setPassword.submit')}
        </Button>
      </form>
    </AuthShell>
  );
}
