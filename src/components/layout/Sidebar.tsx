import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLocale } from '../../context/LocaleContext';
import { useBranding } from '../../context/BrandingContext';
import { useAuth } from '../../context/AuthContext';
import {
  IconOverview,
  IconPeople,
  IconOrgUnits,
  IconClock,
  IconLeave,
  IconHoliday,
  IconPayroll,
  IconSalary,
  IconFinance,
  IconTax,
  IconAudit,
  IconShield,
  IconGeneral,
  IconBranding,
  IconAccess,
  IconFields,
  IconChevronRight,
  IconChevronDown,
  IconCheck,
} from './navIcons';
import './layout.css';

interface NavLeaf {
  to: string;
  label: string;
  icon: (props: { className?: string }) => ReactNode;
  /** Any one of these permissions is enough to show the link. Omit to always show it to any
   * signed-in user. */
  anyOf?: string[];
}

interface NavGroup {
  label: string;
  items: NavLeaf[];
}

interface NavModule {
  key: string;
  label: string;
  icon: (props: { className?: string }) => ReactNode;
  groups: NavGroup[];
}

export function Sidebar() {
  const { t } = useLocale();
  const { branding } = useBranding();
  const { session, hasAnyPermission } = useAuth();
  const location = useLocation();

  const modules: NavModule[] = [
    {
      key: 'hr',
      label: 'Human Resources',
      icon: IconPeople,
      groups: [
        {
          label: 'Workforce',
          items: [
            { to: '/employees', label: t('nav.employees'), icon: IconPeople, anyOf: ['hr.employee.read'] },
            { to: '/org-units', label: t('nav.orgUnits'), icon: IconOrgUnits, anyOf: ['hr.orgunit.read'] },
          ],
        },
        {
          label: 'Time & Leave',
          items: [
            { to: '/attendance', label: t('nav.attendance'), icon: IconClock, anyOf: ['attendance.read'] },
            { to: '/leave', label: t('nav.leave'), icon: IconLeave, anyOf: ['leave.read'] },
            { to: '/holidays', label: t('nav.holidays'), icon: IconHoliday, anyOf: ['holiday.read'] },
          ],
        },
      ],
    },
    {
      key: 'payroll',
      label: 'Payroll',
      icon: IconPayroll,
      groups: [
        {
          label: 'Payroll',
          items: [
            { to: '/payroll', label: t('nav.payroll'), icon: IconPayroll, anyOf: ['payroll.run.read'] },
            {
              to: '/payroll/salary-structures',
              label: t('nav.salaryStructures'),
              icon: IconSalary,
              anyOf: ['payroll.salarystructure.read'],
            },
          ],
        },
      ],
    },
    {
      key: 'finance',
      label: 'Finance',
      icon: IconFinance,
      groups: [
        {
          label: 'Finance',
          items: [
            {
              to: '/finance',
              label: t('nav.finance'),
              icon: IconFinance,
              anyOf: ['finance.loan.read', 'finance.reimbursement.read'],
            },
            { to: '/finance/tax-config', label: t('nav.taxConfig'), icon: IconTax, anyOf: ['finance.taxconfig.read'] },
          ],
        },
      ],
    },
    {
      key: 'admin',
      label: 'Administration',
      icon: IconShield,
      groups: [
        {
          label: 'Administration',
          items: [{ to: '/admin/audit-log', label: t('nav.auditLog'), icon: IconAudit, anyOf: ['audit.log.read'] }],
        },
      ],
    },
  ];

  const settingsLinks: NavLeaf[] = [
    { to: '/settings/config', label: t('nav.settingsConfig'), icon: IconGeneral },
    { to: '/settings/branding', label: t('nav.settingsBranding'), icon: IconBranding, anyOf: ['admin.branding.manage'] },
    { to: '/settings/access', label: t('nav.settingsAccess'), icon: IconAccess, anyOf: ['admin.role.manage', 'admin.user.manage'] },
    { to: '/settings/fields', label: t('nav.settingsFields'), icon: IconFields, anyOf: ['admin.fieldconfig.manage'] },
  ];

  const canSeeLeaf = (leaf: NavLeaf) => !leaf.anyOf || hasAnyPermission(leaf.anyOf);

  const visibleModules = useMemo(
    () =>
      modules
        .map((mod) => ({
          ...mod,
          groups: mod.groups
            .map((group) => ({ ...group, items: group.items.filter(canSeeLeaf) }))
            .filter((group) => group.items.length > 0),
        }))
        .filter((mod) => mod.groups.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.permissions],
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

  const visibleSettingsLinks = settingsLinks.filter(canSeeLeaf);

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
  const initials = (session?.username ?? '?').slice(0, 2).toUpperCase();

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

      {visibleSettingsLinks.length > 0 && (
        <>
          <div className="nav-label">{t('nav.settings')}</div>
          {visibleSettingsLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link sidebar-sublink${isActive ? ' active' : ''}`}
            >
              <link.icon className="link-icon" />
              {link.label}
            </NavLink>
          ))}
        </>
      )}

      <div className="sidebar-footer">
        <div className="avatar">{initials}</div>
        <div>
          <div className="who-name">{session?.username}</div>
          <div className="who-role">{session?.roles[0] ?? ''}</div>
        </div>
      </div>
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
