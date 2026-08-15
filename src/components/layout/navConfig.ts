import type { ReactNode } from 'react';
import {
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
    {
      key: 'settings',
      label: t('nav.settings'),
      icon: IconGeneral,
      groups: [
        {
          label: t('nav.settings'),
          items: [
            { to: '/settings/config', label: t('nav.settingsConfig'), icon: IconGeneral },
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
export function buildSearchIndex(t: T, hasAnyPermission: (names: string[]) => boolean): NavLeaf[] {
  return buildNavModules(t)
    .flatMap((mod) => mod.groups.flatMap((group) => group.items))
    .filter((leaf) => canSeeLeaf(leaf, hasAnyPermission));
}
