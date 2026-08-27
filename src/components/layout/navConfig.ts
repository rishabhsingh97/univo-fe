import type { ReactNode } from 'react';
import {
  IconPeople,
  IconOrgUnits,
  IconLocation,
  IconClock,
  IconLeave,
  IconHoliday,
  IconPayroll,
  IconSalary,
  IconFinance,
  IconTax,
  IconCheck,
  IconDocument,
  IconFields,
  IconTravel,
  IconBell,
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
  /** Optional icon shown next to the group's own header in the sidebar (see Sidebar.tsx's
   * nav-group summary) - distinct from the parent NavModule's icon, which is what the module
   * switcher dropdown renders. */
  icon?: (props: { className?: string }) => ReactNode;
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
          label: 'Approvals',
          items: [{ to: '/approvals', label: t('nav.approvals'), icon: IconCheck }],
        },
        {
          label: 'Travel',
          items: [{ to: '/travel', label: t('nav.travel'), icon: IconTravel }],
        },
        {
          label: 'Tasks',
          items: [{ to: '/tasks', label: t('nav.tasks'), icon: IconCheck }],
        },
        {
          label: 'Services',
          items: [{ to: '/services', label: t('nav.services'), icon: IconCheck }],
        },
        {
          label: 'Onboarding',
          items: [{ to: '/onboarding', label: t('nav.onboarding'), icon: IconCheck }],
        },
        {
          label: 'Workforce',
          items: [
            { to: '/employees', label: t('nav.employees'), icon: IconPeople, anyOf: ['hr.employee.read'] },
            { to: '/org-units', label: t('nav.orgUnits'), icon: IconOrgUnits, anyOf: ['hr.orgunit.read'] },
            { to: '/designations', label: t('nav.designations'), icon: IconOrgUnits, anyOf: ['hr.designation.read'] },
            { to: '/grades', label: t('nav.grades'), icon: IconOrgUnits, anyOf: ['hr.grade.read'] },
            { to: '/locations', label: t('nav.locations'), icon: IconLocation, anyOf: ['hr.location.read'] },
          ],
        },
        {
          label: 'Time & Leave',
          items: [
            { to: '/attendance', label: t('nav.attendance'), icon: IconClock, anyOf: ['attendance.read'] },
            { to: '/shifts', label: t('nav.shifts'), icon: IconClock, anyOf: ['shift.read'] },
            { to: '/roster', label: t('nav.roster'), icon: IconClock, anyOf: ['roster.read'] },
            {
              to: '/attendance-regularization',
              label: t('nav.regularization'),
              icon: IconClock,
              anyOf: ['regularization.read'],
            },
            { to: '/overtime', label: t('nav.overtime'), icon: IconClock, anyOf: ['overtime.read'] },
            { to: '/time-tracker', label: t('nav.timeTracker'), icon: IconClock },
            { to: '/leave', label: t('nav.leave'), icon: IconLeave, anyOf: ['leave.read'] },
            { to: '/holidays', label: t('nav.holidays'), icon: IconHoliday, anyOf: ['holiday.read'] },
          ],
        },
        {
          label: 'Recruitment',
          items: [
            {
              to: '/recruitment/requisitions',
              label: t('nav.jobRequisitions'),
              icon: IconOrgUnits,
              anyOf: ['recruitment.requisition.read'],
            },
            { to: '/recruitment/jobs', label: t('nav.jobs'), icon: IconOrgUnits, anyOf: ['recruitment.job.read'] },
            {
              to: '/recruitment/candidates',
              label: t('nav.candidates'),
              icon: IconPeople,
              anyOf: ['recruitment.candidate.read'],
            },
            {
              to: '/recruitment/interviews',
              label: t('nav.interviews'),
              icon: IconCheck,
              anyOf: ['recruitment.interview.read'],
            },
            { to: '/recruitment/offers', label: t('nav.offers'), icon: IconSalary, anyOf: ['recruitment.offer.read'] },
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
            {
              to: '/payroll/salary-components',
              label: t('nav.salaryComponents'),
              icon: IconSalary,
              anyOf: ['payroll.salarycomponent.read'],
            },
          ],
        },
        {
          label: 'Finance',
          // No moduleKey override - folded into the "hr" module's sidebar for now (same
          // treatment as Payroll above) rather than its own top-level module switcher entry.
          items: [
            {
              to: '/finance',
              label: t('nav.finance'),
              icon: IconFinance,
              anyOf: ['finance.loan.read', 'finance.reimbursement.read'],
            },
            { to: '/finance/tax-config', label: t('nav.taxConfig'), icon: IconTax, anyOf: ['finance.taxconfig.read'] },
            {
              to: '/finance/statutory-config',
              label: t('nav.statutoryConfig'),
              icon: IconTax,
              anyOf: ['finance.statutoryconfig.read', 'finance.taxslabs.read'],
            },
          ],
        },
        {
          label: 'Performance',
          items: [
            { to: '/performance', label: t('nav.performance'), icon: IconCheck, anyOf: ['performance.read'] },
            { to: '/okr', label: t('nav.okr'), icon: IconCheck },
          ],
        },
        {
          label: 'Documents',
          items: [
            { to: '/files', label: t('nav.files'), icon: IconDocument },
            { to: '/hr-letters', label: t('nav.hrLetters'), icon: IconFields },
          ],
        },
        {
          label: 'Engagement',
          items: [{ to: '/engagement', label: t('nav.engagement'), icon: IconBell }],
        },
        {
          label: 'Career & Exit',
          items: [
            { to: '/career', label: t('nav.career'), icon: IconOrgUnits, anyOf: ['career.read'] },
            { to: '/exit', label: t('nav.exit'), icon: IconPeople, anyOf: ['exit.read'] },
            { to: '/full-final', label: t('nav.fullFinal'), icon: IconFinance, anyOf: ['fullfinal.read'] },
            { to: '/retirement', label: t('nav.retirement'), icon: IconClock, anyOf: ['retirement.read'] },
          ],
        },
      ],
    },
    // No "admin" module here - Administration (audit log, branding, access, fields) has no
    // sidebar entries or module-switcher presence at all. It's a single popup opened from the
    // topbar's gear icon (see Topbar.tsx), with those four sections as flat tabs inside
    // AdministrationPage instead of a nav tree - see PopupLayout in AppRoutes.tsx.
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
