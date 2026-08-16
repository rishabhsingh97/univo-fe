import type { ReactNode } from 'react';
import {
  IconPeople,
  IconOrgUnits,
  IconLocation,
  IconDocument,
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
} from './navIcons';

export interface NavLeaf {
  to: string;
  label: string;
  icon: (props: { className?: string }) => ReactNode;
  /** Any one of these permissions is enough to show the link. Omit to always show it to any
   * signed-in user. */
  anyOf?: string[];
}

export interface NavGroup {
  label: string;
  items: NavLeaf[];
  /** Tenant-module key gating this group's visibility (see TenantModuleService.MODULE_KEYS on
   * the backend). Defaults to the parent module's own key - set this when a group lives inside
   * a different module than the plan-gated feature it represents, e.g. the Payroll group nested
   * under the "hr" module but still independently toggleable per tenant. */
  moduleKey?: string;
}

export interface NavModule {
  key: string;
  label: string;
  icon: (props: { className?: string }) => ReactNode;
  groups: NavGroup[];
}

type T = (path: string) => string;

/** The module/group/leaf tree the sidebar renders. Also the source of truth for the topbar's
 * quick-nav search, so both stay in sync from one place. */
export function buildNavModules(t: T): NavModule[] {
  return [
    {
      key: 'hr',
      label: 'Human Resources',
      icon: IconPeople,
      groups: [
        {
          label: 'Workforce',
          items: [
            { to: '/employees', label: t('nav.employees'), icon: IconPeople, anyOf: ['hr.employee.read'] },
            { to: '/departments', label: t('nav.departments'), icon: IconOrgUnits, anyOf: ['hr.orgunit.read'] },
            { to: '/org-units', label: t('nav.orgUnits'), icon: IconOrgUnits, anyOf: ['hr.orgunit.read'] },
            { to: '/designations', label: t('nav.designations'), icon: IconOrgUnits, anyOf: ['hr.designation.read'] },
            { to: '/grades', label: t('nav.grades'), icon: IconOrgUnits, anyOf: ['hr.grade.read'] },
            { to: '/locations', label: t('nav.locations'), icon: IconLocation, anyOf: ['hr.location.read'] },
            {
              to: '/employee-documents',
              label: t('nav.employeeDocuments'),
              icon: IconDocument,
              anyOf: ['hr.document.read'],
            },
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
        {
          label: 'Payroll',
          // No moduleKey override - payroll shares the "hr" tenant-module toggle now (see
          // TenantModuleService.MODULE_KEYS on the backend), it isn't its own flag.
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
    {
      key: 'settings',
      label: t('nav.settings'),
      icon: IconGeneral,
      groups: [
        {
          label: t('nav.settings'),
          items: [
            {
              to: '/settings/branding',
              label: t('nav.settingsBranding'),
              icon: IconBranding,
              anyOf: ['admin.branding.manage'],
            },
            {
              to: '/settings/access',
              label: t('nav.settingsAccess'),
              icon: IconAccess,
              anyOf: ['admin.role.manage', 'admin.user.manage'],
            },
            {
              to: '/settings/fields',
              label: t('nav.settingsFields'),
              icon: IconFields,
              anyOf: ['admin.fieldconfig.manage'],
            },
          ],
        },
      ],
    },
  ];
}

export function canSeeLeaf(leaf: NavLeaf, hasAnyPermission: (names: string[]) => boolean): boolean {
  return !leaf.anyOf || hasAnyPermission(leaf.anyOf);
}

/** Flat, permission-filtered list of every destination in the app - the topbar quick-nav
 * search runs against this. */
export function buildSearchIndex(
  t: T,
  hasAnyPermission: (names: string[]) => boolean,
  disabledModules: string[] = [],
): NavLeaf[] {
  return buildNavModules(t)
    .filter((mod) => !disabledModules.includes(mod.key))
    .flatMap((mod) => mod.groups.filter((group) => !disabledModules.includes(group.moduleKey ?? mod.key)).flatMap((group) => group.items))
    .filter((leaf) => canSeeLeaf(leaf, hasAnyPermission));
}
