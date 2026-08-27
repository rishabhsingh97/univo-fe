import { useEffect, type ReactNode } from 'react';
import { Card } from './Card';
import './ui.css';

/** Centralized overlay used by every edit form and confirm action across the app - one
 * implementation of backdrop/escape-to-close/scroll-lock instead of each page rolling its own.
 * Header and footer are pinned outside the scrolling body so a tall form (e.g. Add Candidate)
 * never scrolls its own close button or action buttons out of reach. `footer` is optional and
 * additive - existing callers that render `.form-actions` inside `children` keep working as-is. */
export function Modal({
  title,
  onClose,
  footer,
  children,
}: {
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <Card className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </Card>
    </div>
  );
}
