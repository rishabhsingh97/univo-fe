import { useState } from 'react';
import { domainApi } from '../../api/public/domainApi';
import { useLocale } from '../../context/LocaleContext';
import { Button, TextField } from '../ui';

interface SubdomainInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onAvailabilityChange?: (available: boolean | null) => void;
}

/** A "choose a subdomain" field with an explicit "Check" button - checking on every keystroke
 * via a debounce would just be a second, redundant path to the same result, so this only ever
 * checks on demand. Shared by the signup wizard (a required step - see SignupStep2Page), the
 * post-signup Administration > Domains page (changing an already-claimed one), and the
 * platform-admin console. Only renders the input + status; the caller owns its own form/submit
 * button since that differs between call sites. */
export function SubdomainInput({ label, value, onChange, onAvailabilityChange }: SubdomainInputProps) {
  const { t } = useLocale();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const runCheck = (candidate: string) => {
    const trimmed = candidate.trim().toLowerCase();
    if (!trimmed) {
      setAvailable(null);
      onAvailabilityChange?.(null);
      return;
    }
    setChecking(true);
    domainApi
      .checkSubdomainAvailability(trimmed)
      .then((result) => {
        setAvailable(result);
        onAvailabilityChange?.(result);
      })
      .catch(() => {
        setAvailable(null);
        onAvailabilityChange?.(null);
      })
      .finally(() => setChecking(false));
  };

  // Editing the field invalidates whatever status was shown for the previous value - stays
  // unknown (not auto-rechecked) until the visitor clicks Check again.
  const handleChange = (next: string) => {
    onChange(next);
    if (available !== null) {
      setAvailable(null);
      onAvailabilityChange?.(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <TextField
            label={label}
            placeholder="acme"
            value={value}
            onChange={(e) => handleChange(e.target.value.toLowerCase())}
            required
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => runCheck(value)}
          disabled={!value.trim() || checking}
        >
          {checking ? t('pages.domains.checkingAvailability') : t('pages.domains.checkAvailability')}
        </Button>
      </div>
      {value.trim() && checking && (
        <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{t('pages.domains.checkingAvailability')}</span>
      )}
      {value.trim() && !checking && available === false && (
        <span style={{ color: 'var(--color-danger)', fontSize: 13 }}>{t('pages.domains.subdomainTaken')}</span>
      )}
      {value.trim() && !checking && available === true && (
        <span style={{ color: 'var(--color-success)', fontSize: 13 }}>{t('pages.domains.subdomainAvailable')}</span>
      )}
    </div>
  );
}
