import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { platformModuleApi } from '../api/platform/platformModuleApi';
import { Button, DataTable, Modal, PageHeader, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { CreateModuleRequest, ModuleResponse } from '../types/platform';

function emptyForm(): CreateModuleRequest {
  return { moduleKey: '', label: '' };
}

export function PlatformModulesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateModuleRequest>(emptyForm());

  const { data, isLoading } = useQuery({ queryKey: ['platform', 'modules'], queryFn: () => platformModuleApi.list() });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['platform', 'modules'] });

  const createMutation = useMutation({
    mutationFn: (request: CreateModuleRequest) => platformModuleApi.create(request),
    onSuccess: () => { invalidate(); setForm(emptyForm()); setShowCreate(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (moduleKey: string) => platformModuleApi.delete(moduleKey),
    onSuccess: invalidate,
  });

  const columns: DataTableColumn<ModuleResponse>[] = [
    { key: 'moduleKey', header: 'Key', render: (m) => m.moduleKey },
    { key: 'label', header: 'Label', render: (m) => m.label },
    {
      key: 'actions',
      header: 'Actions',
      render: (m) => (
        <Button
          variant="danger"
          onClick={() =>
            window.confirm(`Remove the "${m.label}" module? Any tenant with it explicitly toggled will lose that setting.`) &&
            deleteMutation.mutate(m.moduleKey)
          }
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Modules"
        description="Feature modules tenants can be toggled on or off for - adding one here only makes it toggleable per-tenant, it doesn't wire up what the module actually gates in the backend"
        actions={<Button onClick={() => setShowCreate(true)}>+ Add module</Button>}
      />

      <DataTable columns={columns} rows={data ?? []} isLoading={isLoading} getRowKey={(m) => m.moduleKey} />

      {showCreate && (
        <Modal title="New module" onClose={() => setShowCreate(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createMutation.mutate(form); }} className="form-grid">
            <TextField label="Module key" value={form.moduleKey}
              onChange={(e) => setForm({ ...form, moduleKey: e.target.value.toLowerCase() })}
              placeholder="e.g. inventory" required />
            <TextField label="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
            {createMutation.isError && (
              <div style={{ color: 'var(--color-danger)', fontSize: 13, gridColumn: '1 / -1' }}>
                Could not create module - check the key isn't already taken.
              </div>
            )}
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create module'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
