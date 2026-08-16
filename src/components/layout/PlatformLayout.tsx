import type { CSSProperties } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { usePlatformAuth } from '../../context/PlatformAuthContext';
import { Button } from '../ui';
import './layout.css';

/** No full Sidebar (this is two surfaces, not a set of switchable modules like the tenant app) -
 * just a couple of top-level links next to the brand. */
export function PlatformLayout() {
  const { session, logout } = usePlatformAuth();

  const linkStyle = ({ isActive }: { isActive: boolean }): CSSProperties => ({
    fontSize: 13.5,
    fontWeight: 600,
    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
    textDecoration: 'none',
  });

  return (
    <div className="app-main" style={{ height: '100vh' }}>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ fontWeight: 700 }}>RishiERP · Platform Console</div>
          <NavLink to="/platform/clients" style={linkStyle}>Clients</NavLink>
          <NavLink to="/platform/modules" style={linkStyle}>Modules</NavLink>
        </div>
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
