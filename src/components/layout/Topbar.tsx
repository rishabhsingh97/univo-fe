import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { useTimezone } from '../../hooks/useTimezone';
import { notificationApi } from '../../api/notification/notificationApi';
import { conversationApi } from '../../api/common/conversationApi';
import type { NotificationResponse } from '../../types/notification';
import { buildSearchIndex, type NavLeaf } from './navConfig';
import { IconSearch, IconBell, IconMessage, IconHelp, IconLogout, IconGeneral, IconPeople, IconLock, IconMenu } from './navIcons';
import './layout.css';

const MAX_RESULTS = 8;

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
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

  const initials = (session?.email ?? '?').slice(0, 2).toUpperCase();

  return (
    <header className="topbar">
      <button type="button" className="icon-btn topbar-menu-btn" aria-label="Open menu" onClick={onOpenMobileNav}>
        <IconMenu />
      </button>
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
        <MessagesButton />
        <NotificationBell />
        {canSeeAdmin && (
          <button type="button" className="icon-btn" aria-label="Administration" onClick={() => navigate('/admin')}>
            <IconGeneral />
          </button>
        )}
        <button type="button" className="icon-btn" aria-label="Help" onClick={() => navigate('/help')}>
          <IconHelp />
        </button>
        <ProfileMenu email={session?.email} initials={initials} onLogout={logout} />
      </div>
    </header>
  );
}

function NotificationBell() {
  const { t } = useLocale();
  const { format } = useTimezone();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  // 30s poll - approval-outcome notifications aren't latency-sensitive.
  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationApi.unreadCount,
    refetchInterval: 30000,
  });

  // Only fetched once the popover is actually open, not continuously.
  const { data: list } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationApi.list(0, 10),
    enabled: open,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
  };

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
    onSuccess: invalidate,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: invalidate,
  });

  const openRow = (notification: NotificationResponse) => {
    if (!notification.read) {
      markReadMutation.mutate(notification.id);
    }
    setOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const count = unread?.count ?? 0;

  return (
    <div className="icon-menu" ref={ref}>
      <button type="button" className="icon-btn notification-trigger" aria-label={t('topbar.notifications')} onClick={() => setOpen((o) => !o)}>
        <IconBell />
        {count > 0 && <span className="notification-badge">{count > 9 ? '9+' : count}</span>}
      </button>
      {open && (
        <div className="icon-popover notification-popover">
          <div className="notification-popover-header">
            <span>{t('topbar.notifications')}</span>
            {count > 0 && (
              <button type="button" className="notification-mark-all" onClick={() => markAllReadMutation.mutate()}>
                {t('topbar.markAllRead')}
              </button>
            )}
          </div>
          {list && list.content.length > 0 ? (
            list.content.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className={`notification-row${notification.read ? '' : ' notification-row-unread'}`}
                onClick={() => openRow(notification)}
              >
                <div className="notification-row-title">{notification.title}</div>
                <div className="notification-row-message">{notification.message}</div>
                <div className="notification-row-time">{format(notification.createdAt)}</div>
              </button>
            ))
          ) : (
            <div className="icon-popover-empty">{t('topbar.noNotifications')}</div>
          )}
        </div>
      )}
    </div>
  );
}

/** Unlike NotificationBell, no popover here - a conversation list needs a real thread view, so
 * this just navigates to /inbox. The badge count refreshes live via MessagingContext's WebSocket
 * push (see App.tsx); the refetchInterval below is only a safety net for a missed push. */
function MessagesButton() {
  const { t } = useLocale();
  const navigate = useNavigate();

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationApi.list(),
    refetchInterval: 60000,
  });

  const unreadCount = (conversations ?? []).reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <button type="button" className="icon-btn notification-trigger" aria-label={t('topbar.messages')} onClick={() => navigate('/inbox')}>
      <IconMessage />
      {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
    </button>
  );
}

function ProfileMenu({
  email,
  initials,
  onLogout,
}: {
  email: string | undefined;
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
          <div className="profile-menu-name">{email}</div>
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
