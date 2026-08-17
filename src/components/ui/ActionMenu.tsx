import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './ui.css';

export type ActionMenuItemKind = 'view' | 'edit' | 'delete';

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Leaves the item out of the row entirely (e.g. no permission) - lets a page declare its
   * full items array unconditionally instead of building it up with `if` pushes. */
  hidden?: boolean;
  tone?: 'default' | 'danger';
  icon?: ReactNode;
  /** Set by viewAction/editAction/deleteAction - marks an item as one of the row's own icon
   * buttons instead of a "⋮" dropdown entry. Leave unset for anything page-specific (approve,
   * generate credentials, ...); those always land in the dropdown. */
  kind?: ActionMenuItemKind;
}

interface ActionOptions {
  disabled?: boolean;
  hidden?: boolean;
}

/**
 * Factories for the three action kinds every table on this app ends up needing, so a page
 * builds its items array as `[viewAction(...), editAction(...), deleteAction(...)]` instead of
 * re-specifying the same icon/tone pairing by hand each time. Label text still comes from the
 * caller (via its own `t()`) since these live outside any component/hook. ActionMenu renders
 * these three as standalone icon buttons next to the "⋮" trigger - everything else (approve,
 * generate credentials, documents, ...) stays inside the dropdown.
 */
export function viewAction(label: string, onClick: () => void, options?: ActionOptions): ActionMenuItem {
  return { label, icon: <ViewIcon />, onClick, kind: 'view', ...options };
}

export function editAction(label: string, onClick: () => void, options?: ActionOptions): ActionMenuItem {
  return { label, icon: <EditIcon />, onClick, kind: 'edit', ...options };
}

export function deleteAction(label: string, onClick: () => void, options?: ActionOptions): ActionMenuItem {
  return { label, icon: <DeleteIcon />, tone: 'danger', onClick, kind: 'delete', ...options };
}

const QUICK_KINDS: ActionMenuItemKind[] = ['view', 'edit', 'delete'];

/**
 * A row of action controls: View/Edit/Delete (when present, via kind) render as their own icon
 * buttons; every other item - anything page-specific - collapses into a single "⋮" trigger that
 * opens a popover, so the row doesn't grow a new button every time a table gains one more action.
 *
 * The popover is portaled to <body> and positioned from the trigger's own viewport rect rather
 * than rendered inline - table cells sit inside overflow:auto/hidden scroll containers
 * (DataTable's .table-wrapper/.table-shell), which would otherwise clip the popover instead of
 * letting it float above the table.
 */
export function ActionMenu({ items, info }: { items: ActionMenuItem[]; info?: ReactNode }) {
  const visibleItems = items.filter((item) => !item.hidden);
  const quickItems = QUICK_KINDS.map((kind) => visibleItems.find((item) => item.kind === kind)).filter(
    (item): item is ActionMenuItem => Boolean(item),
  );
  const dropdownItems = visibleItems.filter((item) => !item.kind);

  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }
    // Ancestor scroll containers (the table wrapper, the page itself) don't bubble scroll
    // events, so this is capture-phase - simplest way to keep a fixed-position popover from
    // drifting away from its trigger is to just close it instead of tracking every scroll.
    function onScroll() {
      setOpen(false);
    }

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const toggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((o) => !o);
  };

  if (quickItems.length === 0 && dropdownItems.length === 0 && !info) {
    return null;
  }

  return (
    <div className="action-menu-row">
      {quickItems.map((item) => (
        <button
          key={item.label}
          type="button"
          className={`action-icon-btn${item.tone === 'danger' ? ' danger' : ''}`}
          aria-label={item.label}
          title={item.label}
          disabled={item.disabled}
          onClick={item.onClick}
        >
          {item.icon}
        </button>
      ))}
      {(dropdownItems.length > 0 || info) && (
        <>
          <button ref={triggerRef} type="button" className="action-menu-trigger" aria-label="More actions" onClick={toggle}>
            <KebabIcon />
          </button>
          {open &&
            coords &&
            createPortal(
              <div
                ref={popoverRef}
                className="action-menu-popover"
                style={{ position: 'fixed', top: coords.top, right: coords.right }}
              >
                {info && <div className="action-menu-info">{info}</div>}
                {dropdownItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={`action-menu-item${item.tone === 'danger' ? ' danger' : ''}`}
                    disabled={item.disabled}
                    onClick={() => {
                      setOpen(false);
                      item.onClick();
                    }}
                  >
                    {item.icon && <span className="action-menu-item-icon">{item.icon}</span>}
                    {item.label}
                  </button>
                ))}
              </div>,
              document.body,
            )}
        </>
      )}
    </div>
  );
}

function KebabIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Shared icon set for common ActionMenuItem.icon values - kept here rather than the layout-only
// navIcons.tsx, since ui/ components can't depend on components/layout.
export function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function DeleteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function ViewIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
