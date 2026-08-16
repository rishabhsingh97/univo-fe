import { useQuery } from '@tanstack/react-query';
import { orgUnitApi } from '../api/hr/orgUnitApi';
import { useLocale } from '../context/LocaleContext';
import { DataTable, PageHeader } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { OrgUnitResponse } from '../types/hr';

/** A "Department" isn't its own entity - it's an OrgUnit row with type=DEPARTMENT, nested under
 * a BRANCH which is nested under a COMPANY (see OrgUnit.java). This page is a read-only,
 * client-side filtered/enriched view of that same data; editing still happens on Org Structure. */
export function DepartmentsPage() {
  const { t } = useLocale();
  const { data, isLoading } = useQuery({ queryKey: ['org-units', 'select'], queryFn: () => orgUnitApi.list(0, 200) });

  const allOrgUnits = data?.content ?? [];
  const byId = new Map(allOrgUnits.map((unit) => [unit.id, unit]));
  const departments = allOrgUnits.filter((unit) => unit.type === 'DEPARTMENT');

  const columns: DataTableColumn<OrgUnitResponse>[] = [
    { key: 'name', header: t('fields.name'), render: (d) => d.name },
    { key: 'code', header: t('fields.code'), render: (d) => d.code },
    {
      key: 'branch',
      header: t('pages.departments.branch'),
      render: (d) => (d.parentId ? (byId.get(d.parentId)?.name ?? '-') : '-'),
    },
    {
      key: 'company',
      header: t('pages.departments.company'),
      render: (d) => {
        const branch = d.parentId ? byId.get(d.parentId) : undefined;
        const company = branch?.parentId ? byId.get(branch.parentId) : undefined;
        return company?.name ?? '-';
      },
    },
  ];

  return (
    <div>
      <PageHeader title={t('pages.departments.title')} description={t('pages.departments.description')} />
      <DataTable columns={columns} rows={departments} isLoading={isLoading} getRowKey={(d) => d.id} />
    </div>
  );
}
