import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card, PageHeader, SelectField } from '../components/ui';

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

  const handleTimezoneChange = (value: string) => {
    void updateTimezone(value === '' ? null : value);
  };

  return (
    <div>
      <PageHeader title={t('pages.config.title')} description={t('pages.config.description')} />
      <Card>
        <SelectField
          label={t('fields.timezone')}
          value={session?.timezone ?? ''}
          onChange={(e) => handleTimezoneChange(e.target.value)}
          style={{ minWidth: 240 }}
        >
          <option value="">{t('pages.config.tenantDefault')}</option>
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </SelectField>
        <SelectField
          label={t('fields.theme')}
          value={theme}
          onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
          style={{ minWidth: 240, marginTop: 16 }}
        >
          <option value="light">{t('pages.config.themeLight')}</option>
          <option value="dark">{t('pages.config.themeDark')}</option>
        </SelectField>
      </Card>
    </div>
  );
}
