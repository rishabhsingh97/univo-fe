import { Outlet } from 'react-router-dom';
import { usePlatformAuth } from '../../context/PlatformAuthContext';
import { Button } from '../ui';
import './layout.css';

/** Deliberately no Sidebar - the platform console is one surface (Clients) today, not a set
 * of modules to switch between like the tenant app. */
export function PlatformLayout() {
  const { session, logout } = usePlatformAuth();

  return (
    <div className="app-main" style={{ height: '100vh' }}>
      <div className="topbar">
        <div style={{ fontWeight: 700 }}>RishiERP · Platform Console</div>
        <div className="topbar-actions">
          <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>{session?.username}</span>
          <Button variant="secondary" onClick={logout}>Log out</Button>
        </div>
      </div>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
