import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLocale } from '../../context/LocaleContext';
import { useBranding } from '../../context/BrandingContext';
import { useAuth } from '../../context/AuthContext';
import { buildNavModules, canSeeLeaf } from './navConfig';
import { IconOverview, IconChevronRight, IconChevronDown, IconCheck, IconLock, IconX } from './navIcons';
import { Modal } from '../ui/Modal';
import './layout.css';

interface SidebarProps {
  /** Whether the drawer is open on a mobile-width viewport. Ignored above the drawer breakpoint
   * (see .sidebar in layout.css), where the sidebar is always visible inline. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { t } = useLocale();
  const { branding } = useBranding();
  // The drawer's CSS transition would otherwise fire once on first paint too (there's no prior
  // computed transform for the browser to be "changing from", but Vite's dev-mode CSS
  // injection + the first effect pass can still land a frame late enough to make that initial
  // state application read as a slide animation) - skip the transition for exactly one frame so
  // mount is always instant, and only real open/close toggles animate.
  const [transitionsReady, setTransitionsReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setTransitionsReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const { session, hasAnyPermission } = useAuth();
  const location = useLocation();

  const modules = useMemo(() => buildNavModules(t), [t]);

  // A leaf whose own path is a prefix of a sibling's (e.g. "/payroll" vs.
  // "/payroll/salary-structures") must use NavLink's `end` match, or React Router highlights
  // both at once while viewing the more specific route.
  const allLeafPaths = useMemo(
    () => modules.flatMap((mod) => mod.groups.flatMap((group) => group.items.map((item) => item.to))),
    [modules],
  );
  const isPrefixOfSibling = (to: string) => allLeafPaths.some((path) => path !== to && path.startsWith(`${to}/`));

  const visibleModules = useMemo(
    () =>
      modules
        .filter((mod) => !session?.disabledModules?.includes(mod.key))
        .map((mod) => ({
          ...mod,
          groups: mod.groups
            .filter((group) => !session?.disabledModules?.includes(group.moduleKey ?? mod.key))
            .map((group) => ({ ...group, items: group.items.filter((leaf) => canSeeLeaf(leaf, hasAnyPermission)) }))
            .filter((group) => group.items.length > 0),
        }))
        .filter((mod) => mod.groups.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modules, session?.permissions, session?.disabledModules],
  );

  const inferModuleKey = (pathname: string): string | undefined =>
    visibleModules.find((mod) => mod.groups.some((group) => group.items.some((item) => pathname.startsWith(item.to))))
      ?.key;

  const [moduleKey, setModuleKey] = useState<string>(
    () => inferModuleKey(location.pathname) ?? visibleModules[0]?.key ?? '',
  );

  useEffect(() => {
    const inferred = inferModuleKey(location.pathname);
    if (inferred) setModuleKey(inferred);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const activeModule = visibleModules.find((mod) => mod.key === moduleKey) ?? visibleModules[0];

  const visibleModuleKeys = useMemo(() => new Set(visibleModules.map((mod) => mod.key)), [visibleModules]);

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [allModulesOpen, setAllModulesOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setSwitcherOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const brandName = branding?.companyName ?? t('app.name');
  const sidebarClassName = `sidebar${mobileOpen ? ' mobile-open' : ''}${transitionsReady ? '' : ' no-transition'}`;

  if (!activeModule) {
    // No module has any visible items for this user's permission set.
    return (
      <>
        {mobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
        <aside className={sidebarClassName}>
          <SidebarBrand branding={branding} brandName={brandName} onCloseMobile={onCloseMobile} />
          <DashboardLink t={t} />
        </aside>
      </>
    );
  }

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      <aside className={sidebarClassName}>
        <SidebarBrand branding={branding} brandName={brandName} onCloseMobile={onCloseMobile} />

      {visibleModules.length > 1 && (
        <div className="module-switch" ref={switcherRef}>
          <button type="button" className="module-switch-trigger" onClick={() => setSwitcherOpen((open) => !open)}>
            <span className="switch-icon">
              <activeModule.icon />
            </span>
            <span className="switch-label">
              <span className="switch-name">{activeModule.label}</span>
            </span>
            <IconChevronDown className={`switch-chevron${switcherOpen ? ' open' : ''}`} />
          </button>

          {switcherOpen && (
            <div className="switch-menu">
              {visibleModules.map((mod) => (
                <button
                  key={mod.key}
                  type="button"
                  className={`switch-item${mod.key === activeModule.key ? ' current' : ''}`}
                  onClick={() => {
                    setModuleKey(mod.key);
                    setSwitcherOpen(false);
                  }}
                >
                  <span className="switch-icon">
                    <mod.icon />
                  </span>
                  {mod.label}
                  {mod.key === activeModule.key && <IconCheck className="check" />}
                </button>
              ))}
              <button
                type="button"
                className="switch-view-all"
                onClick={() => {
                  setSwitcherOpen(false);
                  setAllModulesOpen(true);
                }}
              >
                View all modules
              </button>
            </div>
          )}
        </div>
      )}

      {visibleModules.length <= 1 && modules.length > visibleModules.length && (
        <button type="button" className="switch-view-all standalone" onClick={() => setAllModulesOpen(true)}>
          View all modules
        </button>
      )}

      {allModulesOpen && (
        <Modal title="All modules" onClose={() => setAllModulesOpen(false)}>
          <div className="all-modules-grid">
            {modules.map((mod) => {
              const locked = !visibleModuleKeys.has(mod.key);
              return (
                <button
                  key={mod.key}
                  type="button"
                  className={`all-modules-card${locked ? ' locked' : ''}${mod.key === activeModule.key ? ' current' : ''}`}
                  disabled={locked}
                  title={locked ? "You don't have access to this module" : undefined}
                  onClick={() => {
                    setModuleKey(mod.key);
                    setAllModulesOpen(false);
                  }}
                >
                  {locked && <IconLock className="lock" />}
                  {!locked && mod.key === activeModule.key && <IconCheck className="check" />}
                  <span className="switch-icon">
                    <mod.icon />
                  </span>
                  <span className="all-modules-label">{mod.label}</span>
                </button>
              );
            })}
          </div>
        </Modal>
      )}

      <DashboardLink t={t} />

      {activeModule.groups.map((group) => {
        const isActiveGroup = group.items.some((item) => location.pathname.startsWith(item.to));
        return (
          <details
            key={group.label}
            name={`nav-group-${activeModule.key}`}
            className="nav-group"
            open={isActiveGroup || activeModule.groups.length === 1}
          >
            <summary className={isActiveGroup ? 'active' : undefined}>
              <IconChevronRight className="chevron" />
              {group.icon && <group.icon className="group-icon" />}
              {group.label}
            </summary>
            <div className="nav-sublist">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={isPrefixOfSibling(item.to)}
                  className={({ isActive }) => `nav-sublink${isActive ? ' active' : ''}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </details>
        );
      })}
      </aside>
    </>
  );
}

function SidebarBrand({
  branding,
  brandName,
  onCloseMobile,
}: {
  branding: { logoUrl?: string | null } | null | undefined;
  brandName: string;
  onCloseMobile: () => void;
}) {
  return (
    <div className="sidebar-brand">
      <span className="sidebar-brand-mark">
        {branding?.logoUrl ? (
          <img src={branding.logoUrl} alt={brandName} style={{ maxHeight: 28, maxWidth: '100%' }} />
        ) : (
          brandName
        )}
      </span>
      <button type="button" className="sidebar-close" aria-label="Close menu" onClick={onCloseMobile}>
        <IconX />
      </button>
    </div>
  );
}

function DashboardLink({ t }: { t: (path: string) => string }) {
  return (
    <NavLink to="/" end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
      <IconOverview className="link-icon" />
      {t('nav.dashboard')}
    </NavLink>
  );
}
