import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { buildSearchIndex, type NavLeaf } from './navConfig';
import { IconSearch, IconBell, IconHelp, IconLogout, IconGeneral, IconPeople, IconLock } from './navIcons';
import './layout.css';

const MAX_RESULTS = 8;

export function Topbar() {
  const { session, logout, hasAnyPermission } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  const searchIndex = useMemo(
    () => buildSearchIndex(t, hasAnyPermission, session?.disabledModules),
    [t, hasAnyPermission, session?.disabledModules],
  );

  // Administration has no sidebar entries of its own (see navConfig.ts / AdministrationPage.tsx)
  // - it's a single popup opened from this header icon instead. Only show the icon if the user
  // can actually see at least one of Administration's four sections, so it never opens to a
  // "you don't have access" screen.
  const canSeeAdmin = hasAnyPermission([
    'audit.log.read',
    'admin.branding.manage',
    'admin.role.manage',
    'admin.user.manage',
    'admin.fieldconfig.manage',
  ]);

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
        {canSeeAdmin && (
          <button type="button" className="icon-btn" aria-label="Administration" onClick={() => navigate('/admin')}>
            <IconGeneral />
          </button>
        )}
        <button type="button" className="icon-btn" aria-label="Help" onClick={() => navigate('/help')}>
          <IconHelp />
        </button>
        <ProfileMenu username={session?.username} initials={initials} onLogout={logout} />
      </div>
    </header>
  );
}

function ProfileMenu({
  username,
  initials,
  onLogout,
}: {
  username: string | undefined;
  initials: string;
  onLogout: () => void;
}) {
  const { t } = useLocale();
  const navigate = useNavigate();
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
    <div className="icon-menu topbar-who" ref={ref}>
      <button type="button" className="avatar avatar-button" aria-label="Profile menu" onClick={() => setOpen((o) => !o)}>
        {initials}
      </button>
      {open && (
        <div className="icon-popover">
          <div className="profile-menu-name">{username}</div>
          <button
            type="button"
            className="profile-menu-item"
            onClick={() => {
              setOpen(false);
              navigate('/my-details');
            }}
          >
            <IconPeople className="link-icon" />
            {t('topbar.myDetails')}
          </button>
          <button
            type="button"
            className="profile-menu-item"
            onClick={() => {
              setOpen(false);
              navigate('/settings/config');
            }}
          >
            <IconGeneral className="link-icon" />
            {t('topbar.myPreferences')}
          </button>
          <button
            type="button"
            className="profile-menu-item"
            onClick={() => {
              setOpen(false);
              navigate('/change-password');
            }}
          >
            <IconLock className="link-icon" />
            {t('topbar.changePassword')}
          </button>
          <button
            type="button"
            className="profile-menu-item"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <IconLogout className="link-icon" />
            {t('topbar.logout')}
          </button>
        </div>
      )}
    </div>
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
