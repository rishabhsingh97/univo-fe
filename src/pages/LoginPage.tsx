import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { useBranding } from '../context/BrandingContext';
import { Button, Card, TextField } from '../components/ui';

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useLocale();
  const { branding, loadBranding } = useBranding();
  const navigate = useNavigate();
  const [tenantCode, setTenantCode] = useState('acme');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ tenantCode, username, password });
      navigate('/');
    } catch {
      setError(t('login.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const brandName = branding?.companyName ?? t('app.name');

  return (
    <div className="login-shell">
      <Card className="login-card">
        {branding?.logoUrl && (
          <img src={branding.logoUrl} alt={brandName} style={{ maxHeight: 40, marginBottom: 16 }} />
        )}
        <h1>{brandName !== t('app.name') ? brandName : t('login.title')}</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TextField
            label={t('login.tenantCode')}
            value={tenantCode}
            onChange={(e) => setTenantCode(e.target.value)}
            onBlur={() => tenantCode && loadBranding(tenantCode)}
            required
          />
          <TextField label={t('login.username')} value={username} onChange={(e) => setUsername(e.target.value)} required />
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
      </Card>
    </div>
  );
}
