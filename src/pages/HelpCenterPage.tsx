import { useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import { Badge, Button, Card, PageHeader } from '../components/ui';
import './help.css';

interface Article {
  title: string;
  description: string;
}

const ARTICLES: Article[] = [
  {
    title: 'Getting started',
    description:
      'Sign in with your tenant code, then use the module switcher at the top of the sidebar to move between Human Resources, Payroll, Finance, and Administration.',
  },
  {
    title: 'Employees & org structure',
    description:
      "Add employees, assign their designation and location, and set who they report to. Org Structure shows the full company → branch → department tree; Departments is a filtered view of the same data.",
  },
  {
    title: 'Designations & Grades',
    description:
      "Each designation (job title) links to exactly one grade - grade is no longer picked separately per employee, it's always whatever the employee's designation carries. Grade 1 is the most senior (e.g. CEO); higher numbers are more junior.",
  },
  {
    title: 'Locations & Employee Documents',
    description:
      'Locations is a simple master list of physical offices employees can be assigned to. Employee Documents lets you pick an employee and upload/download/delete files on file for them (contracts, IDs, etc.).',
  },
  {
    title: 'Attendance & leave',
    description: 'Mark daily attendance, apply for and approve leave, and maintain the holiday calendar under Time & Leave.',
  },
  {
    title: 'Payroll',
    description:
      'Create and process monthly payroll runs and view generated payslips from Payroll; maintain each employee\'s basic/HRA/allowances from Salary Structures. Payroll is part of the HR module, not a separate one.',
  },
  {
    title: 'Finance',
    description: 'Track employee loans and advances, reimbursements, and per-financial-year tax configuration.',
  },
  {
    title: 'Access management',
    description: 'Create roles, assign permissions, and control who can see or edit each module from Settings → Access Management.',
  },
  {
    title: 'Branding & field customization',
    description: "Set your tenant's logo and colors, and relabel, require, or hide fields on existing forms from Settings.",
  },
  {
    title: 'Platform administration',
    description:
      'Platform admins manage tenant clients and, separately, the list of feature modules tenants can be toggled on/off for, from the platform console.',
  },
];

interface ReleaseNoteGroup {
  date: string;
  notes: string[];
}

const RELEASE_NOTES: ReleaseNoteGroup[] = [
  {
    date: '16 August 2026',
    notes: [
      'Payroll is now part of the Human Resources module, not a separate one - Payroll gained run creation/processing and a payslips view, and Salary Structures got its own full page.',
      'Added Departments, Locations, and Employee Documents (upload/download files per employee) under Workforce.',
      'Org Structure now displays as an indented company → branch → department tree instead of a flat list.',
      'Designations and Grades are now separate pages; each designation links to one grade, and grade 1 is now the most senior (e.g. CEO) instead of the highest number.',
      'Relabeled "Manager" to "Reports To" throughout, since not everyone above you in the org chart holds a manager title.',
      'Every data table gained a rows-per-page selector (10/25/50/100).',
      'Platform admins can now manage the list of toggleable feature modules directly, instead of it being fixed.',
      'Designations & Grades master data, plus a new platform admin console for managing tenant clients.',
      'Every data table across the app now has consistent pagination and sorting.',
      "The Overview dashboard now shows live headcount, org units, today's attendance, and pending leave requests.",
      'Settings moved into the module switcher for quicker access.',
      'Added notification, help, and profile menus, plus quick-nav search, to the top bar.',
    ],
  },
  {
    date: '15 August 2026',
    notes: ['Initial release: sign-in, tenant-aware navigation, and the Human Resources, Payroll, Finance, and Administration modules.'],
  },
];

const ROADMAP: Article[] = [
  {
    title: 'Employee login credentials',
    description: "Employee records aren't yet linked to a login account - no way to generate a user for an employee straight from their record.",
  },
  {
    title: 'Employee details page',
    description: "There's no single page to view one employee's full record (profile, documents, history) - documents are managed from a separate page today.",
  },
  {
    title: 'Employee 360 profile',
    description: 'A unified profile combining the above (documents, employment history timeline) into one employee record view.',
  },
  {
    title: 'Statutory payroll',
    description: "PF, ESI, professional tax, TDS slabs, and gratuity as part of the HR payroll flow, beyond today's flat salary structure.",
  },
  {
    title: 'Structured leave & attendance',
    description: 'Configurable leave policies with accrual balances, shift management, and attendance regularization requests.',
  },
  {
    title: 'Recruitment & onboarding',
    description: 'Requisitions, candidate pipelines, offers, and a guided onboarding checklist - part of Human Resources.',
  },
  {
    title: 'Performance reviews',
    description: 'Goal setting and review cycles for employees and managers - part of Human Resources.',
  },
  {
    title: 'Employee & manager self-service',
    description: 'Dedicated ESS/MSS views so employees and managers can act without full admin access.',
  },
  {
    title: 'Custom fields engine',
    description: "Today's Fields & Labels only relabels or hides existing fields; a true custom-fields engine would let tenants add their own.",
  },
  {
    title: 'Expanded reporting & analytics',
    description: 'Cross-module reports beyond the current dashboard summary widgets.',
  },
];

type Tab = 'docs' | 'releaseNotes' | 'roadmap';

export function HelpCenterPage() {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>('docs');

  return (
    <div>
      <PageHeader title={t('pages.help.title')} description={t('pages.help.description')} />

      <div className="row-actions" style={{ marginBottom: 16 }}>
        <Button variant={tab === 'docs' ? 'primary' : 'secondary'} onClick={() => setTab('docs')}>
          {t('pages.help.docsTab')}
        </Button>
        <Button variant={tab === 'releaseNotes' ? 'primary' : 'secondary'} onClick={() => setTab('releaseNotes')}>
          {t('pages.help.releaseNotesTab')}
        </Button>
        <Button variant={tab === 'roadmap' ? 'primary' : 'secondary'} onClick={() => setTab('roadmap')}>
          {t('pages.help.roadmapTab')}
        </Button>
      </div>

      {tab === 'docs' && (
        <Card className="help-panel">
          {ARTICLES.map((article) => (
            <div className="help-row" key={article.title}>
              <span className="help-row-title">{article.title}</span>
              <span className="help-row-desc">{article.description}</span>
            </div>
          ))}
        </Card>
      )}

      {tab === 'releaseNotes' && (
        <Card className="help-panel">
          {RELEASE_NOTES.map((group) => (
            <div key={group.date}>
              <div className="help-note-group-header">{group.date}</div>
              <ul className="help-note-list">
                {group.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ))}
        </Card>
      )}

      {tab === 'roadmap' && (
        <Card className="help-panel">
          {ROADMAP.map((item) => (
            <div className="help-row help-roadmap-row" key={item.title}>
              <div>
                <span className="help-row-title">{item.title}</span>
                <div className="help-row-desc">{item.description}</div>
              </div>
              <Badge tone="warning">{t('pages.help.roadmapPlanned')}</Badge>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
