import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { branchApi } from '../api/hr/branchApi';
import { departmentApi } from '../api/hr/departmentApi';
import { locationApi } from '../api/hr/locationApi';
import { employeeApi } from '../api/hr/employeeApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, DataTable, Modal, PageHeader, PillList, SelectField, Spinner, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { EmployeeResponse } from '../types/hr';
import type { BranchRequest, BranchResponse, DepartmentRequest, DepartmentResponse } from '../types/orgStructure';
import './orgUnits.css';
import './orgChart.css';

type OrgTab = 'BRANCH' | 'DEPARTMENT';
type ActiveTab = OrgTab | 'CHART';

const TABS: OrgTab[] = ['BRANCH', 'DEPARTMENT'];

const TYPE_LABEL: Record<OrgTab, string> = {
  BRANCH: 'Branches',
  DEPARTMENT: 'Departments',
};

const TYPE_LABEL_SINGULAR: Record<OrgTab, string> = {
  BRANCH: 'Branch',
  DEPARTMENT: 'Department',
};

// Branch and Department each belong to the tenant's single Company internally (see
// Organization Settings for that record) - it's not a user-facing picker here. Department
// additionally tags any number of Branches (which branch(es) run it), rather than being a
// strict child of one, since the same department can be shared across branches. See the
// backend's Department/Branch entities for the same reasoning.
const PERMISSION_PREFIX: Record<OrgTab, string> = {
  BRANCH: 'branch',
  DEPARTMENT: 'department',
};

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

const TYPE_ICON: Record<OrgTab, ReactNode> = {
  BRANCH: <BranchIcon />,
  DEPARTMENT: <DepartmentIcon />,
};

function emptyBranchForm(locationId: number | null): BranchRequest {
  return { name: '', code: '', locationId, headquarters: false };
}

function emptyDepartmentForm(): DepartmentRequest {
  return { name: '', code: '', branchIds: [] };
}

/** One node of the reporting-line chart - unchanged from before the org-units split, this tab
 * has nothing to do with the Branch/Department hierarchy above. */
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
  const [activeTab, setActiveTab] = useState<ActiveTab>('BRANCH');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [showCreate, setShowCreate] = useState(false);
  const [branchForm, setBranchForm] = useState<BranchRequest>(emptyBranchForm(null));
  const [departmentForm, setDepartmentForm] = useState<DepartmentRequest>(emptyDepartmentForm());

  const [editingBranch, setEditingBranch] = useState<BranchResponse | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentResponse | null>(null);

  const [viewing, setViewing] = useState<
    | { tab: 'BRANCH'; data: BranchResponse }
    | { tab: 'DEPARTMENT'; data: DepartmentResponse }
    | null
  >(null);

  const changeTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setPage(0);
  };

  const isChart = activeTab === 'CHART';
  const orgTab: OrgTab | null = isChart ? null : (activeTab as OrgTab);
  const canWrite = orgTab !== null && hasPermission(`hr.${PERMISSION_PREFIX[orgTab]}.write`);
  const canDelete = orgTab !== null && hasPermission(`hr.${PERMISSION_PREFIX[orgTab]}.delete`);

  // Unpaginated - every tab's pickers (Branch's Location picker, Department's Branch tags) need
  // the full set regardless of which tab is active.
  const { data: locationsPage, isLoading: locationsLoading } = useQuery({ queryKey: ['locations', 'select'], queryFn: () => locationApi.list(0, 200) });
  const { data: branchesPage, isLoading: branchesLoading } = useQuery({ queryKey: ['branches', 'select'], queryFn: () => branchApi.list(0, 200) });
  const { data: departmentsPage, isLoading: departmentsLoading } = useQuery({ queryKey: ['departments', 'select'], queryFn: () => departmentApi.list(0, 200) });

  const locations = locationsPage?.content ?? [];
  const branches = branchesPage?.content ?? [];
  const departments = departmentsPage?.content ?? [];

  const isLoading = locationsLoading || branchesLoading || departmentsLoading;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['branches'] });
    queryClient.invalidateQueries({ queryKey: ['departments'] });
  };

  const createBranchMutation = useMutation({
    mutationFn: (request: BranchRequest) => branchApi.create(request),
    onSuccess: () => { invalidateAll(); setBranchForm(emptyBranchForm(locations[0]?.id ?? null)); setShowCreate(false); },
  });
  const createDepartmentMutation = useMutation({
    mutationFn: (request: DepartmentRequest) => departmentApi.create(request),
    onSuccess: () => { invalidateAll(); setDepartmentForm(emptyDepartmentForm()); setShowCreate(false); },
  });

  const updateBranchMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: BranchRequest }) => branchApi.update(id, request),
    onSuccess: () => { invalidateAll(); setEditingBranch(null); },
  });
  const updateDepartmentMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: DepartmentRequest }) => departmentApi.update(id, request),
    onSuccess: () => { invalidateAll(); setEditingDepartment(null); },
  });

  const deleteBranchMutation = useMutation({ mutationFn: (id: number) => branchApi.delete(id), onSuccess: invalidateAll });
  const deleteDepartmentMutation = useMutation({ mutationFn: (id: number) => departmentApi.delete(id), onSuccess: invalidateAll });

  const openCreate = () => {
    if (activeTab === 'BRANCH') setBranchForm(emptyBranchForm(locations[0]?.id ?? null));
    if (activeTab === 'DEPARTMENT') setDepartmentForm(emptyDepartmentForm());
    setShowCreate(true);
  };

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    if (activeTab === 'BRANCH') createBranchMutation.mutate(branchForm);
    if (activeTab === 'DEPARTMENT') createDepartmentMutation.mutate(departmentForm);
  };

  const toggleBranchTag = (form: DepartmentRequest, setForm: (next: DepartmentRequest) => void, branchId: number) => {
    const current = form.branchIds ?? [];
    const next = current.includes(branchId) ? current.filter((id) => id !== branchId) : [...current, branchId];
    setForm({ ...form, branchIds: next });
  };

  const rows: (BranchResponse | DepartmentResponse)[] = activeTab === 'BRANCH' ? branches : activeTab === 'DEPARTMENT' ? departments : [];
  const totalElements = rows.length;
  const totalPages = Math.max(Math.ceil(totalElements / pageSize), 1);
  const pageRows = rows.slice(page * pageSize, page * pageSize + pageSize);

  const branchColumns: DataTableColumn<BranchResponse>[] = [
    {
      key: 'name',
      header: t('fields.name'),
      render: (unit) => (
        <div className="org-tree-row">
          <span className="org-tree-icon org-tree-icon-branch">{TYPE_ICON.BRANCH}</span>
          <div className="table-cell-stack">
            <span>{unit.name}</span>
            <span className="table-cell-stack-secondary">{unit.code}</span>
          </div>
        </div>
      ),
      sortKey: 'name',
    },
    { key: 'location', header: t('fields.location'), render: (unit) => unit.locationName },
    {
      key: 'headquarters',
      header: t('fields.headquarters'),
      render: (unit) => (unit.headquarters ? <Badge tone="success">{t('fields.headquarters')}</Badge> : null),
    },
  ];

  const departmentColumns: DataTableColumn<DepartmentResponse>[] = [
    {
      key: 'name',
      header: t('fields.name'),
      render: (unit) => (
        <div className="org-tree-row">
          <span className="org-tree-icon org-tree-icon-department">{TYPE_ICON.DEPARTMENT}</span>
          <div className="table-cell-stack">
            <span>{unit.name}</span>
            <span className="table-cell-stack-secondary">{unit.code}</span>
          </div>
        </div>
      ),
      sortKey: 'name',
    },
    { key: 'branches', header: t('fields.branches'), render: (unit) => <PillList items={unit.branchNames} /> },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.orgUnits.title')}
        description={t('pages.orgUnits.description')}
        actions={
          canWrite && orgTab !== null ? (
            <Button onClick={openCreate}>
              {t('pages.orgUnits.addButton')} {TYPE_LABEL_SINGULAR[orgTab]}
            </Button>
          ) : undefined
        }
      />

      <div className="org-tabs">
        {TABS.map((type) => (
          <button
            key={type}
            type="button"
            className={`org-tab${activeTab === type ? ' active' : ''}`}
            onClick={() => changeTab(type)}
          >
            {TYPE_LABEL[type]}
            <span className="org-tab-count">{type === 'BRANCH' ? branches.length : departments.length}</span>
          </button>
        ))}
        <button
          type="button"
          className={`org-tab${activeTab === 'CHART' ? ' active' : ''}`}
          onClick={() => changeTab('CHART')}
        >
          {t('pages.orgChart.title')}
        </button>
      </div>

      {showCreate && (
        <Modal title={`${t('pages.orgUnits.createTitle')} ${orgTab === null ? '' : TYPE_LABEL_SINGULAR[orgTab]}`} onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="form-grid">
            {activeTab === 'BRANCH' && (
              <>
                <TextField label={t('fields.name')} value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} required />
                <TextField label={t('fields.code')} value={branchForm.code} onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })} required />
                <SelectField label={t('fields.location')} value={branchForm.locationId ?? ''} onChange={(e) => setBranchForm({ ...branchForm, locationId: e.target.value ? Number(e.target.value) : null })} required>
                  <option value="" disabled>{t('common.selectOption')}</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </SelectField>
                <label className="checkbox-option">
                  <input type="checkbox" checked={branchForm.headquarters} onChange={(e) => setBranchForm({ ...branchForm, headquarters: e.target.checked })} />
                  {t('fields.headquarters')}
                </label>
              </>
            )}
            {activeTab === 'DEPARTMENT' && (
              <>
                <TextField label={t('fields.name')} value={departmentForm.name} onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })} required />
                <TextField label={t('fields.code')} value={departmentForm.code} onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value })} required />
                <div className="field">
                  <span className="field-label">{t('fields.branches')}</span>
                  {branches.map((b) => (
                    <label key={b.id} className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={(departmentForm.branchIds ?? []).includes(b.id)}
                        onChange={() => toggleBranchTag(departmentForm, setDepartmentForm, b.id)}
                      />
                      {b.name}
                    </label>
                  ))}
                </div>
              </>
            )}
            <div className="form-actions">
              <Button
                type="submit"
                disabled={createBranchMutation.isPending || createDepartmentMutation.isPending}
              >
                {t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      {activeTab === 'CHART' ? (
        <OrgChartTab />
      ) : activeTab === 'BRANCH' ? (
        <DataTable
          columns={branchColumns}
          rows={pageRows as BranchResponse[]}
          isLoading={isLoading}
          getRowKey={(u) => u.id}
          maxHeight="70vh"
          viewKey="org-units"
          onView={(u) => setViewing({ tab: 'BRANCH', data: u })}
          onEdit={canWrite ? (u) => setEditingBranch(u) : undefined}
          onDelete={canDelete ? (u) => deleteBranchMutation.mutate(u.id) : undefined}
          pagination={{ page, size: pageSize, totalPages, totalElements, onPageChange: setPage, onSizeChange: (size) => { setPageSize(size); setPage(0); } }}
        />
      ) : (
        <DataTable
          columns={departmentColumns}
          rows={pageRows as DepartmentResponse[]}
          isLoading={isLoading}
          getRowKey={(u) => u.id}
          maxHeight="70vh"
          viewKey="org-units"
          onView={(u) => setViewing({ tab: 'DEPARTMENT', data: u })}
          onEdit={canWrite ? (u) => setEditingDepartment(u) : undefined}
          onDelete={canDelete ? (u) => deleteDepartmentMutation.mutate(u.id) : undefined}
          pagination={{ page, size: pageSize, totalPages, totalElements, onPageChange: setPage, onSizeChange: (size) => { setPageSize(size); setPage(0); } }}
        />
      )}

      {editingBranch && (
        <Modal title={`${t('pages.orgUnits.editTitle')} ${TYPE_LABEL_SINGULAR.BRANCH}`} onClose={() => setEditingBranch(null)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updateBranchMutation.mutate({
                id: editingBranch.id,
                request: { name: editingBranch.name, code: editingBranch.code, locationId: editingBranch.locationId, headquarters: editingBranch.headquarters },
              });
            }}
            className="form-grid"
          >
            <TextField label={t('fields.name')} value={editingBranch.name} onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })} required />
            <TextField label={t('fields.code')} value={editingBranch.code} onChange={(e) => setEditingBranch({ ...editingBranch, code: e.target.value })} required />
            <SelectField label={t('fields.location')} value={editingBranch.locationId} onChange={(e) => setEditingBranch({ ...editingBranch, locationId: Number(e.target.value) })} required>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </SelectField>
            <label className="checkbox-option">
              <input type="checkbox" checked={editingBranch.headquarters} onChange={(e) => setEditingBranch({ ...editingBranch, headquarters: e.target.checked })} />
              {t('fields.headquarters')}
            </label>
            <div className="form-actions">
              <Button type="submit" disabled={updateBranchMutation.isPending}>{t('common.save')}</Button>
              <Button type="button" variant="secondary" onClick={() => setEditingBranch(null)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      {editingDepartment && (
        <Modal title={`${t('pages.orgUnits.editTitle')} ${TYPE_LABEL_SINGULAR.DEPARTMENT}`} onClose={() => setEditingDepartment(null)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updateDepartmentMutation.mutate({
                id: editingDepartment.id,
                request: { name: editingDepartment.name, code: editingDepartment.code, branchIds: editingDepartment.branchIds },
              });
            }}
            className="form-grid"
          >
            <TextField label={t('fields.name')} value={editingDepartment.name} onChange={(e) => setEditingDepartment({ ...editingDepartment, name: e.target.value })} required />
            <TextField label={t('fields.code')} value={editingDepartment.code} onChange={(e) => setEditingDepartment({ ...editingDepartment, code: e.target.value })} required />
            <div className="field">
              <span className="field-label">{t('fields.branches')}</span>
              {branches.map((b) => (
                <label key={b.id} className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={editingDepartment.branchIds.includes(b.id)}
                    onChange={() => {
                      const next = editingDepartment.branchIds.includes(b.id)
                        ? editingDepartment.branchIds.filter((id) => id !== b.id)
                        : [...editingDepartment.branchIds, b.id];
                      setEditingDepartment({ ...editingDepartment, branchIds: next });
                    }}
                  />
                  {b.name}
                </label>
              ))}
            </div>
            <div className="form-actions">
              <Button type="submit" disabled={updateDepartmentMutation.isPending}>{t('common.save')}</Button>
              <Button type="button" variant="secondary" onClick={() => setEditingDepartment(null)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      {viewing && (
        <Modal title={viewing.data.name} onClose={() => setViewing(null)}>
          <dl className="detail-grid">
            <div className="detail-row"><dt>{t('fields.code')}</dt><dd>{viewing.data.code}</dd></div>
            {viewing.tab === 'BRANCH' && (
              <>
                <div className="detail-row"><dt>{t('fields.location')}</dt><dd>{viewing.data.locationName}</dd></div>
                <div className="detail-row"><dt>{t('fields.headquarters')}</dt><dd>{viewing.data.headquarters ? t('common.yes') : t('common.no')}</dd></div>
              </>
            )}
            {viewing.tab === 'DEPARTMENT' && (
              <div className="detail-row"><dt>{t('fields.branches')}</dt><dd><PillList items={viewing.data.branchNames} /></dd></div>
            )}
          </dl>
          <div className="form-actions">
            <Button type="button" onClick={() => setViewing(null)}>{t('common.close')}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
