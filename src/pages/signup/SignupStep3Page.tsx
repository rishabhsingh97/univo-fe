import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { signupApi } from '../../api/public/signupApi';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { AuthShell } from '../../components/auth/AuthShell';
import { SignupStepper } from '../../components/auth/SignupStepper';
import { Button } from '../../components/ui';

function HrmsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8.5" cy="6.5" r="2.8" />
      <path d="M3 18c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M14 8a2.3 2.3 0 1 0 0-4.6" />
      <path d="M15.5 13.2c2 .3 3.5 2 3.5 4.8" />
    </svg>
  );
}
function MarketingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9v4h3l5 3.5v-11L6 9H3z" />
      <path d="M14 8.5a3.5 3.5 0 0 1 0 5" />
      <path d="M16.5 6a7 7 0 0 1 0 10" />
    </svg>
  );
}
function SalesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14l4.5-4.5 3 3L17 6" />
      <path d="M12.5 6H17v4.5" />
    </svg>
  );
}
function BillingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3h12v16l-2.5-1.5L12 19l-2.5-1.5L7 19l-2-1.5V3z" />
      <path d="M8 7.5h6M8 11h6M8 14.5h4" />
    </svg>
  );
}
function InventoryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 3l7.5 4.3v7.4L11 19l-7.5-4.3V7.3L11 3z" />
      <path d="M3.5 7.3L11 11.5l7.5-4.2M11 11.5V19" />
    </svg>
  );
}
function FinanceIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18h16" />
      <rect x="5" y="10" width="2.8" height="8" />
      <rect x="9.6" y="6.5" width="2.8" height="11.5" />
      <rect x="14.2" y="12.5" width="2.8" height="5.5" />
    </svg>
  );
}
function ProjectsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="16" height="14" rx="1.5" />
      <path d="M3 8.5h16" />
      <path d="M7 12l1.6 1.6L11.5 10.5" />
    </svg>
  );
}

interface ModuleDef {
  key: string;
  name: string;
  description: string;
  icon: ReactNode;
}

/** Same modules/taglines as univo-landing's product/data.ts, for consistency across the two
 * properties. HRMS is the only one actually provisioned by signup; the rest just record
 * interest for later outreach. */
const MODULES: ModuleDef[] = [
  { key: 'hrms', name: 'HRMS', description: 'Recruitment, workforce, attendance and payroll — live today.', icon: <HrmsIcon /> },
  { key: 'marketing', name: 'Marketing', description: 'Turn interest into pipeline, without switching tools.', icon: <MarketingIcon /> },
  { key: 'sales', name: 'Sales', description: 'From first contact to closed-won, in one pipeline.', icon: <SalesIcon /> },
  { key: 'billing', name: 'Billing', description: 'Invoice, collect and reconcile without leaving the suite.', icon: <BillingIcon /> },
  { key: 'inventory', name: 'Inventory', description: 'Know what you have, and where it is, at all times.', icon: <InventoryIcon /> },
  { key: 'finance', name: 'Finance', description: 'The general ledger every other app already agrees with.', icon: <FinanceIcon /> },
  { key: 'projects', name: 'Projects', description: 'Plan the work, then prove it happened.', icon: <ProjectsIcon /> },
];

/** Step 3 of 3: which modules they're interested in. Submitting this step is what actually
 * provisions the tenant - see SignupController.step3 on the backend. */
export function SignupStep3Page() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { draftId } = useParams<{ draftId: string }>();
  const { setSessionFromLoginResponse } = useAuth();
  const [tenantCode, setTenantCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // The finalize response's JWT is already scoped to the new tenant, but the frontend session
  // object also needs the tenantCode as a plain field (see AuthContext.Session) - fetching the
  // draft here doubles as the same "resume this step" read a page reload would need anyway.
  useEffect(() => {
    if (!draftId) return;
    signupApi.getDraft(Number(draftId)).then((draft) => setTenantCode(draft.tenantCode));
  }, [draftId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draftId || !tenantCode) return;
    setError(null);
    setSubmitting(true);
    try {
      // Only HRMS is real right now (see MODULES above) - the rest are shown so people know
      // what's coming, but aren't selectable yet, so there's nothing else to send here.
      const response = await signupApi.step3(Number(draftId), { modulesInterested: ['hrms'] });
      setSessionFromLoginResponse(tenantCode, response);
      navigate('/');
    } catch {
      setError(t('signup.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell wide>
      <h1>{t('signup.title')}</h1>
      <SignupStepper current={3} />
      {tenantCode && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12.5,
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-primary-soft)',
            color: 'var(--color-primary)',
            marginBottom: 10,
          }}
        >
          {t('signup.workspaceIdLabel')} <strong style={{ fontFamily: 'monospace', fontWeight: 700 }}>{tenantCode}</strong>
        </div>
      )}
      <p className="auth-card-subtitle" style={{ marginTop: 0 }}>
        {t('signup.modulesIntro')}
      </p>
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 14,
            margin: '4px 0 22px',
          }}
        >
          {MODULES.map((m) => {
            const isHrms = m.key === 'hrms';
            return (
              <div
                key={m.key}
                title={isHrms ? undefined : 'Coming soon - not selectable yet'}
                style={{
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 9,
                  padding: 16,
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${isHrms ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: isHrms ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                  boxShadow: isHrms ? 'var(--shadow-sm)' : 'none',
                  opacity: isHrms ? 1 : 0.72,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isHrms ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                      color: isHrms ? '#fff' : 'var(--color-text-muted)',
                      boxShadow: isHrms ? 'var(--shadow-xs)' : 'none',
                    }}
                  >
                    {m.icon}
                  </span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '.03em',
                      color: isHrms ? 'var(--color-success)' : 'var(--color-text-muted)',
                    }}
                  >
                    {isHrms ? t('signup.liveNow') : t('signup.comingSoon')}
                  </span>
                </div>
                <div style={{ fontWeight: 650, fontSize: 14.5 }}>{m.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', lineHeight: 1.45 }}>{m.description}</div>
              </div>
            );
          })}
        </div>
        {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <Button type="submit" disabled={submitting || !tenantCode}>
          {submitting ? t('signup.submitting') : t('signup.finishButton')}
        </Button>
      </form>
    </AuthShell>
  );
}
