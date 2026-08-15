import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/admin/userApi';
import { useLocale } from '../context/LocaleContext';
import { Badge, DataTable, PageHeader, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { UserResponse } from '../types/auth';

const columns: DataTableColumn<UserResponse>[] = [
  { key: 'username', header: 'Username', render: (u) => u.username },
  { key: 'email', header: 'Email', render: (u) => u.email },
  { key: 'roles', header: 'Roles', render: (u) => u.roles.map((r) => r.label).join(', ') },
  { key: 'status', header: 'Status', render: (u) => <Badge tone={statusTone(u.status)}>{u.status}</Badge> },
];

export function UsersPage() {
  const { t } = useLocale();
  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: () => userApi.list(0, 50) });
  return (
    <div>
      <PageHeader title={t('pages.users.title')} description={t('pages.users.description')} />
      <DataTable columns={columns} rows={data?.content ?? []} isLoading={isLoading} getRowKey={(u) => u.id} />
    </div>
  );
}
