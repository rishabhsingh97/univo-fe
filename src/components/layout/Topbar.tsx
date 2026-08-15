import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { buildSearchIndex, type NavLeaf } from './navConfig';
import { IconSearch, IconBell, IconHelp, IconLogout } from './navIcons';
import './layout.css';

const MAX_RESULTS = 8;

export function Topbar() {
  const { session, logout, hasAnyPermission } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  const searchIndex = useMemo(() => buildSearchIndex(t, hasAnyPermission), [t, hasAnyPermission]);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const results: NavLeaf[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchIndex.filter((item) => item.label.toLowerCase().includes(q)).slice(0, MAX_RESULTS);
  }, [query, searchIndex]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const goTo = (to: string) => {
    navigate(to);
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && results[0]) {
      goTo(results[0].to);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const initials = (session?.username ?? '?').slice(0, 2).toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-search" ref={searchRef}>
        <IconSearch className="topbar-search-icon" />
        <input
          type="text"
          className="topbar-search-input"
          placeholder={t('topbar.search')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {open && results.length > 0 && (
          <div className="topbar-search-menu">
            {results.map((item) => (
              <button key={item.to} type="button" className="topbar-search-item" onClick={() => goTo(item.to)}>
                <item.icon className="link-icon" />
                {item.label}
              </button>
            ))}
          </div>
        )}
        {open && query.trim() && results.length === 0 && (
          <div className="topbar-search-menu">
            <div className="topbar-search-empty">No matches</div>
          </div>
        )}
      </div>

      <div className="topbar-actions">
        <IconMenuButton icon={IconBell} label="Notifications">
          <div className="icon-popover-empty">No new notifications</div>
        </IconMenuButton>
        <IconMenuButton icon={IconHelp} label="Help">
          <div className="icon-popover-empty">Need help? Contact your administrator.</div>
        </IconMenuButton>
        <button type="button" className="icon-btn" aria-label={t('topbar.logout')} onClick={logout}>
          <IconLogout />
        </button>
        <div className="topbar-who">
          <div className="avatar">{initials}</div>
          <span className="topbar-who-name">{session?.username}</span>
        </div>
      </div>
    </header>
  );
}

function IconMenuButton({
  icon: Icon,
  label,
  children,
}: {
  icon: (props: { className?: string }) => ReactNode;
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="icon-menu" ref={ref}>
      <button type="button" className="icon-btn" aria-label={label} onClick={() => setOpen((o) => !o)}>
        <Icon />
      </button>
      {open && <div className="icon-popover">{children}</div>}
    </div>
  );
}
