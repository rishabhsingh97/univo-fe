import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Card } from '../ui';
import './layout.css';

/**
 * Route-level chrome for pages with no sidebar entry of their own (My Details, Change Password,
 * My Preferences, Help - see AppRoutes.tsx). Renders the matched child route inside a large
 * (80vw/80vh) popup over the app shell instead of as a plain full-page route, since these are
 * account/utility pages, not module content. Closing goes back to wherever the popup was opened
 * from.
 */
export function PopupLayout() {
  const navigate = useNavigate();
  const close = () => navigate(-1);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="popup-backdrop" onClick={close}>
      <Card className="popup-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="popup-close" onClick={close} aria-label="Close">
          ×
        </button>
        <div className="popup-body">
          <Outlet />
        </div>
      </Card>
    </div>
  );
}
