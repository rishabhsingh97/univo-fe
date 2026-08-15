import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { formatDate, formatDateTime, resolveTimezone } from '../utils/datetime';

/** The single place every page should go through to render a UTC value from the API -
 * resolves user override -> tenant default -> browser zone, then formats. `format` is for true
 * timestamps (has a time-of-day); `formatDate` is for calendar-date-only fields and
 * deliberately ignores the resolved timezone (see utils/datetime.ts for why). */
export function useTimezone() {
  const { session } = useAuth();
  const { branding } = useBranding();
  const timezone = resolveTimezone(session?.timezone, branding?.defaultTimezone);

  return {
    timezone,
    format: (isoUtc: string, options?: Intl.DateTimeFormatOptions) => formatDateTime(isoUtc, timezone, options),
    formatDate: (isoDate: string, options?: Intl.DateTimeFormatOptions) => formatDate(isoDate, options),
  };
}
