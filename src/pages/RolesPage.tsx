import { useQuery } from '@tanstack/react-query';
import { roleApi } from '../api/admin/roleApi';
import { useLocale } from '../context/LocaleContext';
import { DataTable, PageHeader } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { RoleResponse } from '../types/auth';

const columns: DataTableColumn<RoleResponse>[] = [
  { key: 'label', header: 'Role', render: (r) => r.label },
  { key: 'description', header: 'Description', render: (r) => r.description ?? '-' },
  { key: 'permissions', header: 'Permissions', render: (r) => r.permissions.map((p) => p.name).join(', ') },
];

export function RolesPage() {
  const { t } = useLocale();
  const { data, isLoading } = useQuery({ queryKey: ['roles'], queryFn: () => roleApi.list() });
  return (
    <div>
      <PageHeader title={t('pages.roles.title')} description={t('pages.roles.description')} />
      <DataTable columns={columns} rows={data?.content ?? []} isLoading={isLoading} getRowKey={(r) => r.id} />
    </div>
  );
}
