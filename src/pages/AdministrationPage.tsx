import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { Button, PageHeader } from '../components/ui';
import { AuditLogPage } from './AuditLogPage';
import { BrandingPage } from './BrandingPage';
import { RolesManagementPage, UsersManagementPage } from './RolesUsersPage';
import { FieldConfigPage } from './FieldConfigPage';

type Tab = 'auditLog' | 'branding' | 'roles' | 'users' | 'fields';

/**
 * Administration has no sidebar entries of its own (see AppRoutes.tsx / navConfig.ts) - it's a
 * single popup (opened from the topbar's gear icon) with these five sections as flat tabs
 * instead, rather than a module with its own nav tree. Each tab reuses the existing full page
 * component unchanged - none of them depend on routing, so mounting them here instead of at
 * their own route is a no-op for their own logic. None of those components render their own
 * title either - the tab label is the only title, so there's no duplication.
 */
const TABS: { key: Tab; labelKey: string; anyOf: string[] }[] = [
  { key: 'auditLog', labelKey: 'nav.auditLog', anyOf: ['audit.log.read'] },
  { key: 'branding', labelKey: 'nav.settingsBranding', anyOf: ['admin.branding.manage'] },
  { key: 'roles', labelKey: 'nav.roles', anyOf: ['admin.role.manage'] },
  { key: 'users', labelKey: 'nav.users', anyOf: ['admin.user.manage'] },
  { key: 'fields', labelKey: 'nav.settingsFields', anyOf: ['admin.fieldconfig.manage'] },
];

export function AdministrationPage() {
  const { t } = useLocale();
  const { hasAnyPermission } = useAuth();
  const visibleTabs = TABS.filter((tabDef) => hasAnyPermission(tabDef.anyOf));
  const [tab, setTab] = useState<Tab | undefined>(visibleTabs[0]?.key);

  if (!visibleTabs.length) {
    return (
      <div>
        <PageHeader title={t('pages.administration.title')} description={t('pages.administration.description')} />
        <p>{t('pages.administration.noAccess')}</p>
      </div>
    );
  }

  const activeTab = visibleTabs.some((tabDef) => tabDef.key === tab) ? tab : visibleTabs[0].key;

  return (
    <div>
      <div className="row-actions" style={{ marginBottom: 20 }}>
        {visibleTabs.map((tabDef) => (
          <Button key={tabDef.key} variant={activeTab === tabDef.key ? 'primary' : 'secondary'} onClick={() => setTab(tabDef.key)}>
            {t(tabDef.labelKey)}
          </Button>
        ))}
      </div>

      {activeTab === 'auditLog' && <AuditLogPage />}
      {activeTab === 'branding' && <BrandingPage />}
      {activeTab === 'roles' && <RolesManagementPage />}
      {activeTab === 'users' && <UsersManagementPage />}
      {activeTab === 'fields' && <FieldConfigPage />}
    </div>
  );
}
