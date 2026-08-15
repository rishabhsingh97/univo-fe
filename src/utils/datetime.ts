/**
 * The backend only ever stores/returns UTC (ISO-8601 strings). Every conversion to a
 * human-readable, timezone-aware display happens here, in the UI layer - the backend has no
 * opinion on what timezone a user should see.
 */

/** user override -> tenant default -> browser's own zone. Never throws: an invalid/unknown
 * zone id from either preference falls through to the browser's zone via the try/catch in
 * formatDateTime below. */
export function resolveTimezone(userTimezone: string | null | undefined, tenantDefaultTimezone: string | null | undefined): string {
  return userTimezone || tenantDefaultTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** For true point-in-time fields (createdAt, generatedAt, performedAt, runDate, ...) - these
 * carry a time-of-day, so they're rendered in the resolved display timezone. */
export function formatDateTime(isoUtc: string, timezone: string, options?: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone,
      ...options,
    }).format(new Date(isoUtc));
  } catch {
    // Unknown/invalid IANA zone id (e.g. a stale saved preference) - fall back to the
    // browser's own zone rather than showing an error.
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(isoUtc));
  }
}

/** For calendar-date-only fields (holidayDate, attendanceDate, leave start/end, dateOfJoining,
 * requestedDate, submittedDate, effectiveFrom, ...) - these have no time-of-day component, so
 * they're deliberately NOT run through the user's display timezone. "2026-08-15" must always
 * read as Aug 15 everywhere; converting a date-only string through an arbitrary zone can shift
 * it a day in either direction, which is worse than not converting at all. Pinning to UTC for
 * formatting (not display-timezone) is what keeps the calendar date stable. */
export function formatDate(isoDate: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeZone: 'UTC',
    ...options,
  }).format(new Date(isoDate));
}
