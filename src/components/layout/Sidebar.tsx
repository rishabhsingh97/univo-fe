import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLocale } from '../../context/LocaleContext';
import { useBranding } from '../../context/BrandingContext';
import { useAuth } from '../../context/AuthContext';
import { buildNavModules, canSeeLeaf } from './navConfig';
import { IconOverview, IconChevronRight, IconChevronDown, IconCheck } from './navIcons';
import './layout.css';

export function Sidebar() {
  const { t } = useLocale();
  const { branding } = useBranding();
  const { session, hasAnyPermission } = useAuth();
  const location = useLocation();

  const modules = useMemo(() => buildNavModules(t), [t]);

  const visibleModules = useMemo(
    () =>
      modules
        .map((mod) => ({
          ...mod,
          groups: mod.groups
            .map((group) => ({ ...group, items: group.items.filter((leaf) => canSeeLeaf(leaf, hasAnyPermission)) }))
            .filter((group) => group.items.length > 0),
        }))
        .filter((mod) => mod.groups.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modules, session?.permissions],
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

  const [switcherOpen, setSwitcherOpen] = useState(false);
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

  if (!activeModule) {
    // No module has any visible items for this user's permission set.
    return (
      <aside className="sidebar">
        <SidebarBrand branding={branding} brandName={brandName} />
        <DashboardLink t={t} />
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <SidebarBrand branding={branding} brandName={brandName} />

      {visibleModules.length > 1 && (
        <div className="module-switch" ref={switcherRef}>
          <button type="button" className="module-switch-trigger" onClick={() => setSwitcherOpen((open) => !open)}>
            <span className="switch-icon">
              <activeModule.icon />
            </span>
            <span className="switch-label">
              <span className="switch-name">{activeModule.label}</span>
              <span className="switch-tag">Current module</span>
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
            </div>
          )}
        </div>
      )}

      <DashboardLink t={t} />

      {activeModule.groups.map((group) => {
        const isActiveGroup = group.items.some((item) => location.pathname.startsWith(item.to));
        return (
          <details key={group.label} className="nav-group" open={isActiveGroup || activeModule.groups.length === 1}>
            <summary>
              <IconChevronRight className="chevron" />
              {group.label}
            </summary>
            <div className="nav-sublist">
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-sublink${isActive ? ' active' : ''}`}>
                  <span className="dot" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </details>
        );
      })}
    </aside>
  );
}

function SidebarBrand({
  branding,
  brandName,
}: {
  branding: { logoUrl?: string | null } | null | undefined;
  brandName: string;
}) {
  return (
    <div className="sidebar-brand">
      {branding?.logoUrl ? (
        <img src={branding.logoUrl} alt={brandName} style={{ maxHeight: 28, maxWidth: '100%' }} />
      ) : (
        brandName
      )}
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
