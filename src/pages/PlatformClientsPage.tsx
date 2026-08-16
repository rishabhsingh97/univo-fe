import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { platformTenantApi } from '../api/platform/platformTenantApi';
import { Badge, Button, Card, Modal, PageHeader, PagedDataTable, PillList, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { CreateTenantRequest, TenantSummaryResponse } from '../types/platform';

function emptyForm(): CreateTenantRequest {
  return { tenantCode: '', name: '', adminUsername: '', adminEmail: '', adminPassword: '' };
}

export function PlatformClientsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateTenantRequest>(emptyForm());
  const [managingModules, setManagingModules] = useState<TenantSummaryResponse | null>(null);

  const moduleKeysQuery = useQuery({ queryKey: ['platform', 'module-keys'], queryFn: () => platformTenantApi.moduleKeys() });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['platform', 'tenants'] });

  const createMutation = useMutation({
    mutationFn: (request: CreateTenantRequest) => platformTenantApi.create(request),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm());
      setShowCreate(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'ACTIVE' | 'INACTIVE' }) =>
      platformTenantApi.updateStatus(id, { status }),
    onSuccess: invalidate,
  });

  const modulesMutation = useMutation({
    mutationFn: ({ id, modules }: { id: number; modules: Record<string, boolean> }) =>
      platformTenantApi.updateModules(id, { modules }),
    onSuccess: () => {
      invalidate();
      setManagingModules(null);
    },
  });

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate(form);
  };

  const columns: DataTableColumn<TenantSummaryResponse>[] = [
    { key: 'tenantCode', header: 'Tenant code', render: (t) => t.tenantCode, sortKey: 'tenantCode' },
    { key: 'name', header: 'Name', render: (t) => t.name, sortKey: 'name' },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <Badge tone={statusTone(t.status)}>{t.status}</Badge>,
      sortKey: 'status',
    },
    {
      key: 'modules',
      header: 'Disabled modules',
      render: (t) => (t.disabledModules.length > 0 ? <PillList items={t.disabledModules} tone="warning" /> : <span style={{ color: 'var(--color-text-muted)' }}>None</span>),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (t) => (
        <div className="row-actions">
          <Button variant="secondary" onClick={() => setManagingModules(t)}>Modules</Button>
          <Button
            variant={t.status === 'ACTIVE' ? 'danger' : 'primary'}
            disabled={statusMutation.isPending}
            onClick={() => statusMutation.mutate({ id: t.id, status: t.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
          >
            {t.status === 'ACTIVE' ? 'Disable' : 'Enable'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Every tenant on this platform - create new clients, enable/disable them, and control which modules they have access to"
        actions={<Button onClick={() => setShowCreate(true)}>+ Add client</Button>}
      />

      <PagedDataTable columns={columns} queryKey={['platform', 'tenants']} fetchPage={platformTenantApi.list} getRowKey={(t) => t.id} />

      {showCreate && (
        <Modal title="New client" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="form-grid">
            <TextField label="Tenant code" value={form.tenantCode}
              onChange={(e) => setForm({ ...form, tenantCode: e.target.value.toLowerCase() })}
              placeholder="e.g. acme" required />
            <TextField label="Company name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField label="Admin username" value={form.adminUsername} onChange={(e) => setForm({ ...form, adminUsername: e.target.value })} required />
            <TextField label="Admin email" type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} required />
            <TextField label="Admin password" type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} required />
            {createMutation.isError && (
              <div style={{ color: 'var(--color-danger)', fontSize: 13, gridColumn: '1 / -1' }}>
                Could not create client - check the tenant code isn't already taken.
              </div>
            )}
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create client'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </form>
        </Modal>
      )}

      {managingModules && (
        <ManageModulesModal
          tenant={managingModules}
          moduleKeys={moduleKeysQuery.data ?? []}
          onClose={() => setManagingModules(null)}
          onSave={(modules) => modulesMutation.mutate({ id: managingModules.id, modules })}
          isSaving={modulesMutation.isPending}
        />
      )}
    </div>
  );
}

function ManageModulesModal({
  tenant,
  moduleKeys,
  onClose,
  onSave,
  isSaving,
}: {
  tenant: TenantSummaryResponse;
  moduleKeys: string[];
  onClose: () => void;
  onSave: (modules: Record<string, boolean>) => void;
  isSaving: boolean;
}) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(moduleKeys.map((key) => [key, !tenant.disabledModules.includes(key)])),
  );

  return (
    <Modal title={`Modules for ${tenant.name}`} onClose={onClose}>
      <Card style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
        <div className="checkbox-group">
          {moduleKeys.map((key) => (
            <label key={key} className="checkbox-option">
              <input
                type="checkbox"
                checked={enabled[key] ?? true}
                onChange={(e) => setEnabled({ ...enabled, [key]: e.target.checked })}
              />
              {key}
            </label>
          ))}
        </div>
      </Card>
      <div className="form-actions" style={{ marginTop: 16 }}>
        <Button type="button" disabled={isSaving} onClick={() => onSave(enabled)}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </Modal>
  );
}
