import { useEffect, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { brandingApi } from '../api/public/brandingApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { Button, Card, PageHeader, TextField } from '../components/ui';
import type { TenantBrandingResponse, TenantBrandingRequest } from '../types/branding';

function toForm(branding: TenantBrandingResponse | null): TenantBrandingRequest {
  return {
    companyName: branding?.companyName ?? '',
    logoUrl: branding?.logoUrl ?? '',
    faviconUrl: branding?.faviconUrl ?? '',
    fontFamily: branding?.fontFamily ?? '',
    primaryColor: branding?.primaryColor ?? '',
    secondaryColor: branding?.secondaryColor ?? '',
  };
}

function formatThemeVars(themeVars: Record<string, string> | null | undefined): string {
  return themeVars && Object.keys(themeVars).length > 0 ? JSON.stringify(themeVars, null, 2) : '';
}

export function BrandingPage() {
  const { t } = useLocale();
  const { session } = useAuth();
  const { branding, loadBranding } = useBranding();
  const [form, setForm] = useState<TenantBrandingRequest>(() => toForm(branding));
  // Edited as raw JSON text rather than parsed on every keystroke, since an in-progress edit is
  // frequently invalid JSON (e.g. before the closing brace is typed).
  const [themeVarsText, setThemeVarsText] = useState(() => formatThemeVars(branding?.themeVars));
  const [themeVarsError, setThemeVarsError] = useState<string | null>(null);

  useEffect(() => {
    setForm(toForm(branding));
    setThemeVarsText(formatThemeVars(branding?.themeVars));
  }, [branding]);

  const saveMutation = useMutation({
    mutationFn: (request: TenantBrandingRequest) => brandingApi.update(request),
    onSuccess: async () => {
      if (session?.tenantCode) await loadBranding(session.tenantCode);
    },
  });

  const resetMutation = useMutation({
    // Empty request -> every branding column is nulled out server-side, which the backend
    // treats as "no branding configured" and the app then renders with its built-in defaults.
    mutationFn: () => brandingApi.update({}),
    onSuccess: async () => {
      setThemeVarsError(null);
      if (session?.tenantCode) await loadBranding(session.tenantCode);
    },
  });

  const handleReset = () => {
    if (window.confirm(t('pages.branding.confirmReset'))) {
      resetMutation.mutate();
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    let themeVars: Record<string, string> | undefined;
    if (themeVarsText.trim()) {
      try {
        themeVars = JSON.parse(themeVarsText);
      } catch {
        setThemeVarsError(t('pages.branding.themeVarsInvalid'));
        return;
      }
    }
    setThemeVarsError(null);
    saveMutation.mutate({ ...form, themeVars });
  };

  return (
    <div>
      <PageHeader title={t('pages.branding.title')} description={t('pages.branding.description')} />
      <Card>
        <form onSubmit={handleSubmit} className="form-grid">
          <TextField
            label={t('fields.companyName')}
            value={form.companyName ?? ''}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
          <TextField
            label={t('fields.logoUrl')}
            value={form.logoUrl ?? ''}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
          />
          <TextField
            label={t('fields.faviconUrl')}
            value={form.faviconUrl ?? ''}
            onChange={(e) => setForm({ ...form, faviconUrl: e.target.value })}
          />
          <TextField
            label={t('fields.fontFamily')}
            value={form.fontFamily ?? ''}
            onChange={(e) => setForm({ ...form, fontFamily: e.target.value })}
          />
          <TextField
            label={t('fields.primaryColor')}
            type="color"
            value={form.primaryColor || '#000000'}
            onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
          />
          <TextField
            label={t('fields.secondaryColor')}
            type="color"
            value={form.secondaryColor || '#000000'}
            onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
          />
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label className="field-label" htmlFor="theme-vars">
              {t('fields.themeVars')}
            </label>
            <textarea
              id="theme-vars"
              className="input"
              rows={6}
              spellCheck={false}
              placeholder={'{\n  "--radius-md": "4px",\n  "--color-success": "#1a8a5a"\n}'}
              value={themeVarsText}
              onChange={(e) => {
                setThemeVarsText(e.target.value);
                if (themeVarsError) setThemeVarsError(null);
              }}
              style={{ fontFamily: 'monospace', fontSize: 12.5, resize: 'vertical' }}
            />
            {themeVarsError && <span style={{ color: 'var(--color-danger)', fontSize: 13 }}>{themeVarsError}</span>}
          </div>
          <div className="form-actions">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
            <Button type="button" variant="secondary" onClick={handleReset} disabled={resetMutation.isPending}>
              {resetMutation.isPending ? t('pages.branding.resetting') : t('pages.branding.resetButton')}
            </Button>
            {saveMutation.isSuccess && <span>{t('pages.branding.saved')}</span>}
            {resetMutation.isSuccess && <span>{t('pages.branding.resetDone')}</span>}
          </div>
        </form>
      </Card>
    </div>
  );
}
