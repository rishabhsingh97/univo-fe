import type { ReactNode } from 'react';
import './ui.css';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

/** Maps common status strings (PENDING/APPROVED/ACTIVE/...) to a sensible tone, so every page
 * that shows a status doesn't have to redecide the color mapping. */
export function statusTone(status: string): BadgeTone {
  const positive = ['APPROVED', 'ACTIVE', 'COMPLETED', 'PRESENT'];
  const negative = ['REJECTED', 'INACTIVE', 'TERMINATED', 'ABSENT'];
  const warning = ['PENDING', 'DRAFT', 'HALF_DAY', 'ON_LEAVE'];
  if (positive.includes(status)) return 'success';
  if (negative.includes(status)) return 'danger';
  if (warning.includes(status)) return 'warning';
  return 'neutral';
}
