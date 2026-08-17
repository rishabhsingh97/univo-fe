import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orgUnitApi } from '../api/hr/orgUnitApi';
import { employeeApi } from '../api/hr/employeeApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Button, DataTable, Modal, PageHeader, SelectField, Spinner, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { EmployeeResponse, OrgUnitRequest, OrgUnitResponse, OrgUnitType } from '../types/hr';
import './orgUnits.css';
import './orgChart.css';

const ORG_UNIT_TYPES: OrgUnitType[] = ['COMPANY', 'BRANCH', 'DEPARTMENT'];
type ActiveTab = OrgUnitType | 'CHART';

function CompanyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 21V9h6v12" />
      <path d="M9 13h.01M9 17h.01M15 13h.01M15 17h.01" />
    </svg>
  );
}

function BranchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function DepartmentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="19" r="2.5" />
      <path d="M12 7.5v5M12 12.5 6.6 17M12 12.5l5.4 4.5" />
    </svg>
  );
}

const TYPE_ICON: Record<OrgUnitType, ReactNode> = {
  COMPANY: <CompanyIcon />,
  BRANCH: <BranchIcon />,
  DEPARTMENT: <DepartmentIcon />,
};

const TYPE_LABEL: Record<OrgUnitType, string> = {
  COMPANY: 'Companies',
  BRANCH: 'Branches',
  DEPARTMENT: 'Departments',
};

function emptyForm(type: OrgUnitType): OrgUnitRequest {
  return { name: '', code: '', type, parentId: null };
}

/**
 * One node of the reporting-line chart. Its own direct reports are only fetched once expanded
 * (react-query's `enabled` gate) - the chart never loads more of the org than what's currently
 * visible on screen, so it scales to a tenant with thousands of employees the same way it does
 * to one with a handful.
 */
function OrgChartNode({ employee, onNavigate }: { employee: EmployeeResponse; onNavigate: (id: number) => void }) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);

  const { data: reportsPage, isFetching } = useQuery({
    queryKey: ['employees', employee.id, 'direct-reports'],
    queryFn: () => employeeApi.directReports(employee.id, 0, 50),
    enabled: expanded,
  });
  const children = reportsPage?.content ?? [];

  return (
    <li>
      <div className="org-node" onClick={() => onNavigate(employee.id)}>
        <span className="org-node-name">{employee.firstName} {employee.lastName}</span>
        <span className="org-node-title">{employee.designationTitle ?? employee.employeeCode}</span>
        <button
          type="button"
          className={`org-node-toggle${expanded ? ' expanded' : ''}`}
          aria-label={expanded ? t('pages.orgChart.collapse') : t('pages.orgChart.expand')}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((current) => !current);
          }}
        >
          <span className="org-node-toggle-chevron" aria-hidden="true">▾</span>
        </button>
      </div>
      {expanded &&
        (isFetching ? (
          <ul><li className="org-node-loading"><Spinner /></li></ul>
        ) : children.length > 0 ? (
          <ul>{children.map((child) => <OrgChartNode key={child.id} employee={child} onNavigate={onNavigate} />)}</ul>
        ) : (
          <ul><li className="org-node-empty">{t('pages.orgChart.noDirectReports')}</li></ul>
        ))}
    </li>
  );
}

/** The reporting-line visualization, shown as the "Org Chart" tab - lives here instead of its
 * own sidebar entry since it's really just another view over the same org data. Starts from
 * the (usually few) employees with no manager; everything below a node loads lazily on expand. */
function OrgChartTab() {
  const { t } = useLocale();
  const navigate = useNavigate();

  const { data: rootsPage, isLoading } = useQuery({ queryKey: ['employees', 'org-chart', 'roots'], queryFn: () => employeeApi.roots(0, 50) });
  const roots = rootsPage?.content ?? [];

  if (isLoading) {
    return <Spinner />;
  }

  return roots.length === 0 ? (
    <p>{t('pages.orgChart.empty')}</p>
  ) : (
    <div className="orgchart-scroll">
      <ul className="orgchart-tree">
        {roots.map((employee) => (
          <OrgChartNode key={employee.id} employee={employee} onNavigate={(id) => navigate(`/employees/${id}`)} />
        ))}
      </ul>
    </div>
  );
}

export function OrgUnitsPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>('COMPANY');
  const [form, setForm] = useState<OrgUnitRequest>(emptyForm('COMPANY'));
  const [editing, setEditing] = useState<OrgUnitResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const changeTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setPage(0);
  };

  const canWrite = hasPermission('hr.orgunit.write');
  const canDelete = hasPermission('hr.orgunit.delete');

  // The whole set, unpaginated - each tab's table is a client-side filter over this, and the
  // parent pickers below need every unit regardless of which tab is active.
  const { data: allOrgUnits, isLoading } = useQuery({ queryKey: ['org-units', 'select'], queryFn: () => orgUnitApi.list(0, 200) });
  const units = allOrgUnits?.content ?? [];
  const parentOptions = units;
  const unitsForActiveTab = activeTab === 'CHART' ? [] : units.filter((u) => u.type === activeTab);
  const totalElements = unitsForActiveTab.length;
  const totalPages = Math.max(Math.ceil(totalElements / pageSize), 1);
  const pageRows = unitsForActiveTab.slice(page * pageSize, page * pageSize + pageSize);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['org-units'] });

  const createMutation = useMutation({
    mutationFn: (request: OrgUnitRequest) => orgUnitApi.create(request),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm(activeTab === 'CHART' ? 'COMPANY' : activeTab));
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: OrgUnitRequest }) => orgUnitApi.update(id, request),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => orgUnitApi.delete(id),
    onSuccess: invalidate,
  });

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate(form);
  };

  const handleUpdate = (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    updateMutation.mutate({
      id: editing.id,
      request: { name: editing.name, code: editing.code, type: editing.type, parentId: editing.parentId },
    });
  };

  const columns: DataTableColumn<OrgUnitResponse>[] = [
    {
      key: 'name',
      header: t('fields.name'),
      render: (unit) => (
        <div className="org-tree-row">
          <span className={`org-tree-icon org-tree-icon-${unit.type.toLowerCase()}`}>{TYPE_ICON[unit.type]}</span>
          <div className="table-cell-stack">
            <span>{unit.name}</span>
            <span className="table-cell-stack-secondary">{unit.code}</span>
          </div>
        </div>
      ),
      sortKey: 'name',
    },
    ...(activeTab === 'COMPANY' || activeTab === 'CHART'
      ? []
      : [{ key: 'parent', header: t('fields.parent'), render: (unit: OrgUnitResponse) => unit.parentName ?? '-' }]),
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.orgUnits.title')}
        description={t('pages.orgUnits.description')}
        actions={
          canWrite && activeTab !== 'CHART' ? (
            <Button onClick={() => { setForm(emptyForm(activeTab)); setShowCreate(true); }}>{t('pages.orgUnits.addButton')}</Button>
          ) : undefined
        }
      />

      <div className="org-tabs">
        {ORG_UNIT_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className={`org-tab${activeTab === type ? ' active' : ''}`}
            onClick={() => changeTab(type)}
          >
            <span className={`org-tree-icon org-tree-icon-${type.toLowerCase()}`}>{TYPE_ICON[type]}</span>
            {TYPE_LABEL[type]}
            <span className="org-tab-count">{units.filter((u) => u.type === type).length}</span>
          </button>
        ))}
        <button
          type="button"
          className={`org-tab${activeTab === 'CHART' ? ' active' : ''}`}
          onClick={() => changeTab('CHART')}
        >
          <span className="org-tree-icon org-tree-icon-chart"><ChartIcon /></span>
          {t('pages.orgChart.title')}
        </button>
      </div>

      {showCreate && (
        <Modal title={t('pages.orgUnits.createTitle')} onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="form-grid">
            <TextField label={t('fields.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField label={t('fields.code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            <SelectField label={t('fields.type')} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as OrgUnitType })}>
              {ORG_UNIT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </SelectField>
            <SelectField
              label={t('fields.parent')}
              value={form.parentId ?? ''}
              onChange={(e) => setForm({ ...form, parentId: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">{t('pages.orgUnits.noParent')}</option>
              {parentOptions.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </SelectField>
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      {activeTab === 'CHART' ? (
        <OrgChartTab />
      ) : (
        <DataTable
          columns={columns}
          rows={pageRows}
          isLoading={isLoading}
          getRowKey={(u) => u.id}
          maxHeight="70vh"
          onEdit={canWrite ? (u) => setEditing(u) : undefined}
          onDelete={canDelete ? (u) => deleteMutation.mutate(u.id) : undefined}
          pagination={{
            page,
            size: pageSize,
            totalPages,
            totalElements,
            onPageChange: setPage,
            onSizeChange: (size) => { setPageSize(size); setPage(0); },
          }}
        />
      )}

      {editing && (
        <Modal title={t('pages.orgUnits.editTitle')} onClose={() => setEditing(null)}>
          <form onSubmit={handleUpdate} className="form-grid">
            <TextField label={t('fields.name')} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
            <TextField label={t('fields.code')} value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} required />
            <SelectField label={t('fields.type')} value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as OrgUnitType })}>
              {ORG_UNIT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </SelectField>
            <SelectField
              label={t('fields.parent')}
              value={editing.parentId ?? ''}
              onChange={(e) => setEditing({ ...editing, parentId: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">{t('pages.orgUnits.noParent')}</option>
              {parentOptions.filter((u) => u.id !== editing.id).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </SelectField>
            <div className="form-actions">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t('common.saving') : t('common.save')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
