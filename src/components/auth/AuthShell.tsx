import type { ReactNode } from 'react';

interface AuthShellProps {
  children: ReactNode;
  /** Signup step 3's module grid needs more room than a single-column form. */
  wide?: boolean;
}

const STATS: { num: string; label: string }[] = [
  { num: '1', label: 'login for the suite' },
  { num: '100%', label: 'permission-gated' },
  { num: 'Per-tenant', label: 'data isolation' },
];

/** Shared split-screen shell for every auth page (login, platform login, the signup wizard) -
 * a branded left panel plus the actual form on the right. Brand copy is deliberately generic
 * (not the signed-in tenant's own branding, which still shows inside the form card itself via
 * BrandingContext) since this chrome is about the Univo platform, not any one tenant. Mirrors
 * univo-landing's hero framing/stats for the same reason that repo's CLAUDE.md gives for
 * pinning design tokens to univo-fe's theme.css - the marketing site and the product should
 * read as one brand. */
export function AuthShell({ children, wide }: AuthShellProps) {
  return (
    <div className="auth-shell">
      <div className="auth-brand-panel">
        <div className="auth-brand-mark">
          <span className="auth-brand-mark-icon" aria-hidden="true" />
          Univo
        </div>
        <div className="auth-brand-copy">
          <h2>One suite for how your business runs.</h2>
          <p>Recruitment, workforce, attendance and payroll — live today, with the rest of the Univo suite on the way.</p>
        </div>
        <div className="auth-brand-stats">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="auth-brand-stat-num">{s.num}</div>
              <div className="auth-brand-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="auth-form-panel">
        <div className={`auth-card${wide ? ' auth-card-wide' : ''}`}>{children}</div>
      </div>
    </div>
  );
}
