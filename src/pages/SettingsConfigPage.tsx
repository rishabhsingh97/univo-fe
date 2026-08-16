import { useEffect, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button, Card, PageHeader, SelectField } from '../components/ui';

type Theme = 'light' | 'dark';

// A short curated list rather than every IANA zone - keeps the picker usable. Extend as
// needed; the backend accepts any valid IANA zone id regardless of what's listed here.
const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export function SettingsConfigPage() {
  const { t } = useLocale();
  const { session, updateTimezone } = useAuth();
  const { theme, setTheme } = useTheme();

  const [timezoneDraft, setTimezoneDraft] = useState(session?.timezone ?? '');
  const [themeDraft, setThemeDraft] = useState<Theme>(theme);

  useEffect(() => {
    setTimezoneDraft(session?.timezone ?? '');
  }, [session?.timezone]);

  useEffect(() => {
    setThemeDraft(theme);
  }, [theme]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (timezoneDraft !== (session?.timezone ?? '')) {
        await updateTimezone(timezoneDraft === '' ? null : timezoneDraft);
      }
      if (themeDraft !== theme) {
        setTheme(themeDraft);
      }
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    saveMutation.mutate();
  };

  return (
    <div>
      <PageHeader title={t('pages.config.title')} description={t('pages.config.description')} />
      <Card>
        <form onSubmit={handleSubmit} className="form-grid">
          <SelectField
            label={t('fields.timezone')}
            value={timezoneDraft}
            onChange={(e) => setTimezoneDraft(e.target.value)}
            style={{ minWidth: 240 }}
          >
            <option value="">{t('pages.config.tenantDefault')}</option>
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </SelectField>
          <SelectField
            label={t('fields.theme')}
            value={themeDraft}
            onChange={(e) => setThemeDraft(e.target.value as Theme)}
            style={{ minWidth: 240 }}
          >
            <option value="light">{t('pages.config.themeLight')}</option>
            <option value="dark">{t('pages.config.themeDark')}</option>
          </SelectField>
          <div className="form-actions">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
            {saveMutation.isSuccess && <span>{t('pages.config.saved')}</span>}
          </div>
        </form>
      </Card>
    </div>
  );
}
