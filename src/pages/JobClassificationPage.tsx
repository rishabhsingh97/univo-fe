import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jobCategoryApi } from '../api/hr/jobCategoryApi';
import { designationApi } from '../api/hr/designationApi';
import { gradeApi } from '../api/hr/gradeApi';
import { departmentApi } from '../api/hr/departmentApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Modal, PageHeader, PagedDataTable, PillList, SelectField, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { DesignationRequest, DesignationResponse, GradeRequest, GradeResponse } from '../types/hr';
import type { DepartmentResponse, JobCategoryRequest, JobCategoryResponse } from '../types/orgStructure';
import './orgUnits.css';

type Tab = 'JOB_CATEGORY' | 'DESIGNATION' | 'GRADE';
const TABS: Tab[] = ['JOB_CATEGORY', 'DESIGNATION', 'GRADE'];

function emptyJobCategoryForm(): JobCategoryRequest {
  return { name: '', code: '', departmentIds: [] };
}

function emptyDesignationForm(): DesignationRequest {
  return { title: '', code: '', description: '', gradeId: 0, departmentId: undefined, jobCategoryId: undefined, active: true };
}

function toDesignationRequest(d: DesignationResponse): DesignationRequest {
  return {
    title: d.title,
    code: d.code,
    description: d.description ?? '',
    gradeId: d.gradeId ?? 0,
    departmentId: d.departmentId ?? undefined,
    jobCategoryId: d.jobCategoryId ?? undefined,
    active: d.active,
  };
}

function emptyGradeForm(): GradeRequest {
  return {
    name: '', code: '', description: '', level: 0,
    experienceMinYears: undefined, experienceMaxYears: undefined,
    compensationMin: undefined, compensationMax: undefined,
    variablePayPercent: undefined, promotionCycleMonths: undefined,
    nextGradeId: undefined, active: true,
  };
}

function toGradeRequest(g: GradeResponse): GradeRequest {
  return {
    name: g.name, code: g.code, description: g.description ?? '', level: g.level,
    experienceMinYears: g.experienceMinYears ?? undefined,
    experienceMaxYears: g.experienceMaxYears ?? undefined,
    compensationMin: g.compensationMin ?? undefined,
    compensationMax: g.compensationMax ?? undefined,
    variablePayPercent: g.variablePayPercent ?? undefined,
    promotionCycleMonths: g.promotionCycleMonths ?? undefined,
    nextGradeId: g.nextGradeId ?? undefined,
    active: g.active,
  };
}

function DesignationFormFields({
  form, onChange, gradeOptions, departmentOptions, jobCategoryOptions,
}: {
  form: DesignationRequest;
  onChange: (next: DesignationRequest) => void;
  gradeOptions: GradeResponse[];
  departmentOptions: DepartmentResponse[];
  jobCategoryOptions: JobCategoryResponse[];
}) {
  const { t } = useLocale();
  return (
    <>
      <TextField label={t('fields.designation')} value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })} required />
      <TextField label={t('fields.code')} value={form.code} onChange={(e) => onChange({ ...form, code: e.target.value })} required />
      <TextField label={t('fields.description')} value={form.description ?? ''} onChange={(e) => onChange({ ...form, description: e.target.value })} />
      <SelectField label={t('fields.grade')} value={form.gradeId || ''}
        onChange={(e) => onChange({ ...form, gradeId: Number(e.target.value) })} required>
        <option value="">{t('common.selectOption')}</option>
        {gradeOptions.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
      </SelectField>
      <SelectField label={t('fields.department')} value={form.departmentId ?? ''}
        onChange={(e) => onChange({ ...form, departmentId: e.target.value ? Number(e.target.value) : undefined })}>
        <option value="">{t('common.selectOption')}</option>
        {departmentOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </SelectField>
      <SelectField label={t('fields.jobCategory')} value={form.jobCategoryId ?? ''}
        onChange={(e) => onChange({ ...form, jobCategoryId: e.target.value ? Number(e.target.value) : undefined })}>
        <option value="">{t('common.selectOption')}</option>
        {jobCategoryOptions.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
      </SelectField>
      <label className="checkbox-option">
        <input type="checkbox" checked={form.active} onChange={(e) => onChange({ ...form, active: e.target.checked })} />
        {t('fields.active')}
      </label>
    </>
  );
}

function GradeFormFields({
  form, onChange, gradeOptions,
}: {
  form: GradeRequest;
  onChange: (next: GradeRequest) => void;
  gradeOptions: GradeResponse[];
}) {
  const { t } = useLocale();
  const numberOrUndefined = (value: string) => (value === '' ? undefined : Number(value));
  return (
    <>
      <TextField label={t('fields.grade')} value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} required />
      <TextField label={t('fields.code')} value={form.code} onChange={(e) => onChange({ ...form, code: e.target.value })} required />
      <TextField label={t('fields.description')} value={form.description ?? ''} onChange={(e) => onChange({ ...form, description: e.target.value })} />
      <TextField label={t('fields.level')} type="number" value={form.level} onChange={(e) => onChange({ ...form, level: Number(e.target.value) })} required />
      <TextField label={t('fields.experienceMinYears')} type="number" value={form.experienceMinYears ?? ''}
        onChange={(e) => onChange({ ...form, experienceMinYears: numberOrUndefined(e.target.value) })} />
      <TextField label={t('fields.experienceMaxYears')} type="number" value={form.experienceMaxYears ?? ''}
        onChange={(e) => onChange({ ...form, experienceMaxYears: numberOrUndefined(e.target.value) })} />
      <TextField label={t('fields.compensationMin')} type="number" value={form.compensationMin ?? ''}
        onChange={(e) => onChange({ ...form, compensationMin: numberOrUndefined(e.target.value) })} />
      <TextField label={t('fields.compensationMax')} type="number" value={form.compensationMax ?? ''}
        onChange={(e) => onChange({ ...form, compensationMax: numberOrUndefined(e.target.value) })} />
      <TextField label={t('fields.variablePayPercent')} type="number" value={form.variablePayPercent ?? ''}
        onChange={(e) => onChange({ ...form, variablePayPercent: numberOrUndefined(e.target.value) })} />
      <TextField label={t('fields.promotionCycleMonths')} type="number" value={form.promotionCycleMonths ?? ''}
        onChange={(e) => onChange({ ...form, promotionCycleMonths: numberOrUndefined(e.target.value) })} />
      <SelectField label={t('fields.nextGrade')} value={form.nextGradeId ?? ''}
        onChange={(e) => onChange({ ...form, nextGradeId: e.target.value ? Number(e.target.value) : undefined })}>
        <option value="">{t('pages.orgUnits.noParent')}</option>
        {gradeOptions.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
      </SelectField>
      <label className="checkbox-option">
        <input type="checkbox" checked={form.active} onChange={(e) => onChange({ ...form, active: e.target.checked })} />
        {t('fields.active')}
      </label>
    </>
  );
}

export function JobClassificationPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('JOB_CATEGORY');

  const canWriteJobCategory = hasPermission('hr.jobcategory.write');
  const canDeleteJobCategory = hasPermission('hr.jobcategory.delete');
  const canWriteDesignation = hasPermission('hr.designation.write');
  const canDeleteDesignation = hasPermission('hr.designation.delete');
  const canWriteGrade = hasPermission('hr.grade.write');
  const canDeleteGrade = hasPermission('hr.grade.delete');

  const { data: allDepartments } = useQuery({ queryKey: ['departments', 'select'], queryFn: () => departmentApi.list(0, 200) });
  const departmentOptions = allDepartments?.content ?? [];
  const { data: allGrades } = useQuery({ queryKey: ['grades', 'select'], queryFn: () => gradeApi.list(0, 200) });
  const gradeOptions = allGrades?.content ?? [];
  const { data: allJobCategories } = useQuery({ queryKey: ['job-categories', 'select'], queryFn: () => jobCategoryApi.list(0, 200) });
  const jobCategoryOptions = allJobCategories?.content ?? [];

  // Job Category tab
  const [jobCategoryForm, setJobCategoryForm] = useState<JobCategoryRequest>(emptyJobCategoryForm());
  const [editingJobCategory, setEditingJobCategory] = useState<JobCategoryResponse | null>(null);
  const [showCreateJobCategory, setShowCreateJobCategory] = useState(false);

  const invalidateJobCategories = () => queryClient.invalidateQueries({ queryKey: ['job-categories'] });
  const createJobCategoryMutation = useMutation({
    mutationFn: (request: JobCategoryRequest) => jobCategoryApi.create(request),
    onSuccess: () => { invalidateJobCategories(); setJobCategoryForm(emptyJobCategoryForm()); setShowCreateJobCategory(false); },
  });
  const updateJobCategoryMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: JobCategoryRequest }) => jobCategoryApi.update(id, request),
    onSuccess: () => { invalidateJobCategories(); setEditingJobCategory(null); },
  });
  const deleteJobCategoryMutation = useMutation({ mutationFn: (id: number) => jobCategoryApi.delete(id), onSuccess: invalidateJobCategories });

  const toggleDepartmentTag = (form: JobCategoryRequest, setForm: (next: JobCategoryRequest) => void, departmentId: number) => {
    const current = form.departmentIds ?? [];
    const next = current.includes(departmentId) ? current.filter((id) => id !== departmentId) : [...current, departmentId];
    setForm({ ...form, departmentIds: next });
  };

  const jobCategoryColumns: DataTableColumn<JobCategoryResponse>[] = [
    { key: 'name', header: t('fields.name'), render: (j) => j.name, sortKey: 'name' },
    { key: 'code', header: t('fields.code'), render: (j) => j.code, sortKey: 'code' },
    { key: 'departments', header: t('fields.departments'), render: (j) => <PillList items={j.departmentNames} /> },
  ];

  // Designation tab
  const [designationForm, setDesignationForm] = useState<DesignationRequest>(emptyDesignationForm());
  const [editingDesignation, setEditingDesignation] = useState<DesignationResponse | null>(null);
  const [editDesignationForm, setEditDesignationForm] = useState<DesignationRequest | null>(null);
  const [showCreateDesignation, setShowCreateDesignation] = useState(false);

  const invalidateDesignations = () => queryClient.invalidateQueries({ queryKey: ['designations'] });
  const createDesignationMutation = useMutation({
    mutationFn: (request: DesignationRequest) => designationApi.create(request),
    onSuccess: () => { invalidateDesignations(); setDesignationForm(emptyDesignationForm()); setShowCreateDesignation(false); },
  });
  const updateDesignationMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: DesignationRequest }) => designationApi.update(id, request),
    onSuccess: () => { invalidateDesignations(); setEditingDesignation(null); setEditDesignationForm(null); },
  });
  const deleteDesignationMutation = useMutation({ mutationFn: (id: number) => designationApi.delete(id), onSuccess: invalidateDesignations });

  const openEditDesignation = (d: DesignationResponse) => {
    setEditingDesignation(d);
    setEditDesignationForm(toDesignationRequest(d));
  };

  const designationColumns: DataTableColumn<DesignationResponse>[] = [
    { key: 'title', header: t('fields.designation'), render: (d) => d.title, sortKey: 'title' },
    { key: 'code', header: t('fields.code'), render: (d) => d.code, sortKey: 'code' },
    { key: 'grade', header: t('fields.grade'), render: (d) => d.gradeName ?? '-' },
    { key: 'department', header: t('fields.department'), render: (d) => d.departmentName ?? '-' },
    { key: 'jobCategory', header: t('fields.jobCategory'), render: (d) => d.jobCategoryName ?? '-' },
    { key: 'active', header: t('fields.active'), render: (d) => <Badge tone={d.active ? 'success' : 'neutral'}>{d.active ? t('common.active') : t('common.inactive')}</Badge> },
  ];

  // Grade tab
  const [gradeForm, setGradeForm] = useState<GradeRequest>(emptyGradeForm());
  const [editingGrade, setEditingGrade] = useState<GradeResponse | null>(null);
  const [editGradeForm, setEditGradeForm] = useState<GradeRequest | null>(null);
  const [showCreateGrade, setShowCreateGrade] = useState(false);

  const invalidateGrades = () => queryClient.invalidateQueries({ queryKey: ['grades'] });
  const createGradeMutation = useMutation({
    mutationFn: (request: GradeRequest) => gradeApi.create(request),
    onSuccess: () => { invalidateGrades(); setGradeForm(emptyGradeForm()); setShowCreateGrade(false); },
  });
  const updateGradeMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: GradeRequest }) => gradeApi.update(id, request),
    onSuccess: () => { invalidateGrades(); setEditingGrade(null); setEditGradeForm(null); },
  });
  const deleteGradeMutation = useMutation({ mutationFn: (id: number) => gradeApi.delete(id), onSuccess: invalidateGrades });

  const openEditGrade = (g: GradeResponse) => {
    setEditingGrade(g);
    setEditGradeForm(toGradeRequest(g));
  };

  const gradeColumns: DataTableColumn<GradeResponse>[] = [
    { key: 'level', header: t('fields.level'), render: (g) => g.level, sortKey: 'level' },
    { key: 'name', header: t('fields.grade'), render: (g) => g.name, sortKey: 'name' },
    { key: 'code', header: t('fields.code'), render: (g) => g.code, sortKey: 'code' },
    { key: 'nextGrade', header: t('fields.nextGrade'), render: (g) => g.nextGradeName ?? '-' },
    { key: 'active', header: t('fields.active'), render: (g) => <Badge tone={g.active ? 'success' : 'neutral'}>{g.active ? t('fields.active') : t('common.inactive')}</Badge> },
  ];

  const TAB_LABEL: Record<Tab, string> = {
    JOB_CATEGORY: t('pages.jobClassification.tabs.jobCategory'),
    DESIGNATION: t('pages.jobClassification.tabs.designation'),
    GRADE: t('pages.jobClassification.tabs.grade'),
  };

  const addAction =
    activeTab === 'JOB_CATEGORY' && canWriteJobCategory ? (
      <Button onClick={() => { setJobCategoryForm(emptyJobCategoryForm()); setShowCreateJobCategory(true); }}>
        {t('pages.jobClassification.jobCategory.addButton')}
      </Button>
    ) : activeTab === 'DESIGNATION' && canWriteDesignation ? (
      <Button onClick={() => setShowCreateDesignation(true)}>{t('pages.designations.addButton')}</Button>
    ) : activeTab === 'GRADE' && canWriteGrade ? (
      <Button onClick={() => setShowCreateGrade(true)}>{t('pages.grades.addButton')}</Button>
    ) : undefined;

  return (
    <div>
      <PageHeader title={t('pages.jobClassification.title')} description={t('pages.jobClassification.description')} actions={addAction} />

      <div className="org-tabs">
        {TABS.map((tab) => (
          <button key={tab} type="button" className={`org-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
            {TAB_LABEL[tab]}
          </button>
        ))}
      </div>

      {activeTab === 'JOB_CATEGORY' && (
        <>
          {showCreateJobCategory && (
            <Modal title={t('pages.jobClassification.jobCategory.createTitle')} onClose={() => setShowCreateJobCategory(false)}>
              <form onSubmit={(event: FormEvent) => { event.preventDefault(); createJobCategoryMutation.mutate(jobCategoryForm); }} className="form-grid">
                <TextField label={t('fields.name')} value={jobCategoryForm.name} onChange={(e) => setJobCategoryForm({ ...jobCategoryForm, name: e.target.value })} required />
                <TextField label={t('fields.code')} value={jobCategoryForm.code} onChange={(e) => setJobCategoryForm({ ...jobCategoryForm, code: e.target.value })} required />
                <div className="field">
                  <span className="field-label">{t('fields.departments')}</span>
                  {departmentOptions.map((d) => (
                    <label key={d.id} className="checkbox-option">
                      <input type="checkbox" checked={(jobCategoryForm.departmentIds ?? []).includes(d.id)}
                        onChange={() => toggleDepartmentTag(jobCategoryForm, setJobCategoryForm, d.id)} />
                      {d.name}
                    </label>
                  ))}
                </div>
                <div className="form-actions">
                  <Button type="submit" disabled={createJobCategoryMutation.isPending}>{t('common.create')}</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowCreateJobCategory(false)}>{t('common.cancel')}</Button>
                </div>
              </form>
            </Modal>
          )}

          <PagedDataTable
            columns={jobCategoryColumns}
            queryKey={['job-categories']}
            fetchPage={jobCategoryApi.list}
            getRowKey={(j) => j.id}
            onEdit={canWriteJobCategory ? (j) => setEditingJobCategory(j) : undefined}
            onDelete={canDeleteJobCategory ? (j) => deleteJobCategoryMutation.mutate(j.id) : undefined}
          />

          {editingJobCategory && (
            <Modal title={t('pages.jobClassification.jobCategory.editTitle')} onClose={() => setEditingJobCategory(null)}>
              <form
                onSubmit={(event: FormEvent) => {
                  event.preventDefault();
                  updateJobCategoryMutation.mutate({
                    id: editingJobCategory.id,
                    request: { name: editingJobCategory.name, code: editingJobCategory.code, departmentIds: editingJobCategory.departmentIds },
                  });
                }}
                className="form-grid"
              >
                <TextField label={t('fields.name')} value={editingJobCategory.name} onChange={(e) => setEditingJobCategory({ ...editingJobCategory, name: e.target.value })} required />
                <TextField label={t('fields.code')} value={editingJobCategory.code} onChange={(e) => setEditingJobCategory({ ...editingJobCategory, code: e.target.value })} required />
                <div className="field">
                  <span className="field-label">{t('fields.departments')}</span>
                  {departmentOptions.map((d) => (
                    <label key={d.id} className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={editingJobCategory.departmentIds.includes(d.id)}
                        onChange={() => {
                          const next = editingJobCategory.departmentIds.includes(d.id)
                            ? editingJobCategory.departmentIds.filter((id) => id !== d.id)
                            : [...editingJobCategory.departmentIds, d.id];
                          setEditingJobCategory({ ...editingJobCategory, departmentIds: next });
                        }}
                      />
                      {d.name}
                    </label>
                  ))}
                </div>
                <div className="form-actions">
                  <Button type="submit" disabled={updateJobCategoryMutation.isPending}>{t('common.save')}</Button>
                  <Button type="button" variant="secondary" onClick={() => setEditingJobCategory(null)}>{t('common.cancel')}</Button>
                </div>
              </form>
            </Modal>
          )}
        </>
      )}

      {activeTab === 'DESIGNATION' && (
        <>
          {showCreateDesignation && (
            <Modal title={t('pages.designations.createTitle')} onClose={() => setShowCreateDesignation(false)}>
              <form onSubmit={(event: FormEvent) => { event.preventDefault(); createDesignationMutation.mutate(designationForm); }} className="form-grid">
                <DesignationFormFields form={designationForm} onChange={setDesignationForm} gradeOptions={gradeOptions} departmentOptions={departmentOptions} jobCategoryOptions={jobCategoryOptions} />
                <div className="form-actions">
                  <Button type="submit" disabled={createDesignationMutation.isPending || !designationForm.gradeId}>
                    {createDesignationMutation.isPending ? t('common.creating') : t('common.create')}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setShowCreateDesignation(false)}>{t('common.cancel')}</Button>
                </div>
              </form>
            </Modal>
          )}

          <PagedDataTable
            columns={designationColumns}
            queryKey={['designations']}
            fetchPage={designationApi.list}
            getRowKey={(d) => d.id}
            onEdit={canWriteDesignation ? openEditDesignation : undefined}
            onDelete={canDeleteDesignation ? (d) => deleteDesignationMutation.mutate(d.id) : undefined}
          />

          {editingDesignation && editDesignationForm && (
            <Modal title={t('pages.designations.editTitle')} onClose={() => { setEditingDesignation(null); setEditDesignationForm(null); }}>
              <form
                onSubmit={(event: FormEvent) => {
                  event.preventDefault();
                  updateDesignationMutation.mutate({ id: editingDesignation.id, request: editDesignationForm });
                }}
                className="form-grid"
              >
                <DesignationFormFields form={editDesignationForm} onChange={setEditDesignationForm} gradeOptions={gradeOptions} departmentOptions={departmentOptions} jobCategoryOptions={jobCategoryOptions} />
                <div className="form-actions">
                  <Button type="submit" disabled={updateDesignationMutation.isPending}>
                    {updateDesignationMutation.isPending ? t('common.saving') : t('common.save')}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => { setEditingDesignation(null); setEditDesignationForm(null); }}>{t('common.cancel')}</Button>
                </div>
              </form>
            </Modal>
          )}
        </>
      )}

      {activeTab === 'GRADE' && (
        <>
          {showCreateGrade && (
            <Modal title={t('pages.grades.createTitle')} onClose={() => setShowCreateGrade(false)}>
              <form onSubmit={(event: FormEvent) => { event.preventDefault(); createGradeMutation.mutate(gradeForm); }} className="form-grid">
                <GradeFormFields form={gradeForm} onChange={setGradeForm} gradeOptions={gradeOptions} />
                <div className="form-actions">
                  <Button type="submit" disabled={createGradeMutation.isPending}>
                    {createGradeMutation.isPending ? t('common.creating') : t('common.create')}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setShowCreateGrade(false)}>{t('common.cancel')}</Button>
                </div>
              </form>
            </Modal>
          )}

          <PagedDataTable
            columns={gradeColumns}
            queryKey={['grades']}
            fetchPage={gradeApi.list}
            getRowKey={(g) => g.id}
            onEdit={canWriteGrade ? openEditGrade : undefined}
            onDelete={canDeleteGrade ? (g) => deleteGradeMutation.mutate(g.id) : undefined}
          />

          {editingGrade && editGradeForm && (
            <Modal title={t('pages.grades.editTitle')} onClose={() => { setEditingGrade(null); setEditGradeForm(null); }}>
              <form
                onSubmit={(event: FormEvent) => {
                  event.preventDefault();
                  updateGradeMutation.mutate({ id: editingGrade.id, request: editGradeForm });
                }}
                className="form-grid"
              >
                <GradeFormFields form={editGradeForm} onChange={setEditGradeForm} gradeOptions={gradeOptions.filter((g) => g.id !== editingGrade.id)} />
                <div className="form-actions">
                  <Button type="submit" disabled={updateGradeMutation.isPending}>
                    {updateGradeMutation.isPending ? t('common.saving') : t('common.save')}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => { setEditingGrade(null); setEditGradeForm(null); }}>{t('common.cancel')}</Button>
                </div>
              </form>
            </Modal>
          )}
        </>
      )}
    </div>
  );
}
