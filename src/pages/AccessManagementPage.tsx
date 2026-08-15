import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roleApi } from '../api/admin/roleApi';
import { userApi } from '../api/admin/userApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Card, DataTable, Modal, PageHeader, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { RoleRequest, RoleResponse, UserResponse } from '../types/auth';

function emptyRoleForm(): RoleRequest {
  return { name: '', label: '', description: '', permissionIds: [] };
}

function toggleId(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id];
}

export function AccessManagementPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<'roles' | 'users'>('roles');
  const [form, setForm] = useState<RoleRequest>(emptyRoleForm());
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null);
  const [assigningUser, setAssigningUser] = useState<UserResponse | null>(null);
  const [assignRoleIds, setAssignRoleIds] = useState<number[]>([]);

  const canManageRoles = hasPermission('admin.role.manage');
  const canManageUsers = hasPermission('admin.user.manage');

  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: () => roleApi.list() });
  const permissionsQuery = useQuery({ queryKey: ['permissions'], queryFn: () => roleApi.listPermissions() });
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: () => userApi.list(0, 50) });

  const roles = rolesQuery.data ?? [];
  const permissions = permissionsQuery.data ?? [];
  const users = usersQuery.data?.content ?? [];

  const invalidateRoles = () => queryClient.invalidateQueries({ queryKey: ['roles'] });

  const createRoleMutation = useMutation({
    mutationFn: (request: RoleRequest) => roleApi.create(request),
    onSuccess: () => {
      invalidateRoles();
      setForm(emptyRoleForm());
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: RoleRequest }) => roleApi.update(id, request),
    onSuccess: () => {
      invalidateRoles();
      setEditingRole(null);
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: number) => roleApi.delete(id),
    onSuccess: invalidateRoles,
  });

  const assignRolesMutation = useMutation({
    mutationFn: ({ id, roleIds }: { id: number; roleIds: number[] }) => userApi.assignRoles(id, { roleIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setAssigningUser(null);
    },
  });

  const handleCreateRole = (event: FormEvent) => {
    event.preventDefault();
    createRoleMutation.mutate(form);
  };

  const handleUpdateRole = (event: FormEvent) => {
    event.preventDefault();
    if (!editingRole) return;
    updateRoleMutation.mutate({
      id: editingRole.id,
      request: {
        name: editingRole.name,
        label: editingRole.label,
        description: editingRole.description ?? undefined,
        permissionIds: editingRole.permissions.map((p) => p.id),
      },
    });
  };

  const openAssign = (user: UserResponse) => {
    setAssigningUser(user);
    setAssignRoleIds(user.roles.map((r) => r.id));
  };

  const handleAssignRoles = (event: FormEvent) => {
    event.preventDefault();
    if (!assigningUser) return;
    assignRolesMutation.mutate({ id: assigningUser.id, roleIds: assignRoleIds });
  };

  const roleColumns: DataTableColumn<RoleResponse>[] = [
    { key: 'label', header: t('fields.label'), render: (r) => r.label },
    { key: 'description', header: t('fields.description'), render: (r) => r.description ?? '-' },
    { key: 'permissions', header: t('fields.permissions'), render: (r) => r.permissions.map((p) => p.name).join(', ') },
  ];
  if (canManageRoles) {
    roleColumns.push({
      key: 'actions',
      header: t('common.actions'),
      render: (r) => (
        <div className="row-actions">
          <Button variant="secondary" onClick={() => setEditingRole(r)}>{t('common.edit')}</Button>
          <Button variant="danger" onClick={() => window.confirm(t('common.confirmDelete')) && deleteRoleMutation.mutate(r.id)}>
            {t('common.delete')}
          </Button>
        </div>
      ),
    });
  }

  const userColumns: DataTableColumn<UserResponse>[] = [
    { key: 'username', header: t('login.username'), render: (u) => u.username },
    { key: 'email', header: t('fields.email'), render: (u) => u.email },
    { key: 'roles', header: t('pages.accessManagement.rolesTab'), render: (u) => u.roles.map((r) => r.label).join(', ') || '-' },
    { key: 'status', header: t('fields.status'), render: (u) => <Badge tone={statusTone(u.status)}>{u.status}</Badge> },
  ];
  if (canManageUsers) {
    userColumns.push({
      key: 'actions',
      header: t('common.actions'),
      render: (u) => <Button variant="secondary" onClick={() => openAssign(u)}>{t('common.edit')}</Button>,
    });
  }

  return (
    <div>
      <PageHeader title={t('pages.accessManagement.title')} description={t('pages.accessManagement.description')} />

      <div className="row-actions" style={{ marginBottom: 16 }}>
        <Button variant={tab === 'roles' ? 'primary' : 'secondary'} onClick={() => setTab('roles')}>
          {t('pages.accessManagement.rolesTab')}
        </Button>
        <Button variant={tab === 'users' ? 'primary' : 'secondary'} onClick={() => setTab('users')}>
          {t('pages.accessManagement.usersTab')}
        </Button>
      </div>

      {tab === 'roles' && (
        <>
          {canManageRoles && (
            <Card style={{ marginBottom: 24 }}>
              <h2 style={{ marginTop: 0 }}>{t('pages.accessManagement.createRole')}</h2>
              <form onSubmit={handleCreateRole} className="form-grid">
                <TextField label={t('fields.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <TextField label={t('fields.label')} value={form.label ?? ''} onChange={(e) => setForm({ ...form, label: e.target.value })} />
                <TextField label={t('fields.description')} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <div className="field">
                  <span className="field-label">{t('fields.permissions')}</span>
                  <div className="checkbox-group">
                    {permissions.map((p) => (
                      <label key={p.id} className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={form.permissionIds.includes(p.id)}
                          onChange={() => setForm({ ...form, permissionIds: toggleId(form.permissionIds, p.id) })}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-actions">
                  <Button type="submit" disabled={createRoleMutation.isPending}>
                    {createRoleMutation.isPending ? t('common.creating') : t('common.create')}
                  </Button>
                </div>
              </form>
            </Card>
          )}
          <DataTable columns={roleColumns} rows={roles} isLoading={rolesQuery.isLoading} getRowKey={(r) => r.id} />
        </>
      )}

      {tab === 'users' && (
        <DataTable columns={userColumns} rows={users} isLoading={usersQuery.isLoading} getRowKey={(u) => u.id} />
      )}

      {editingRole && (
        <Modal title={t('pages.accessManagement.editRole')} onClose={() => setEditingRole(null)}>
          <form onSubmit={handleUpdateRole} className="form-grid">
            <TextField label={t('fields.name')} value={editingRole.name} onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })} required />
            <TextField label={t('fields.label')} value={editingRole.label} onChange={(e) => setEditingRole({ ...editingRole, label: e.target.value })} />
            <TextField
              label={t('fields.description')}
              value={editingRole.description ?? ''}
              onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
            />
            <div className="field">
              <span className="field-label">{t('fields.permissions')}</span>
              <div className="checkbox-group">
                {permissions.map((p) => {
                  const checked = editingRole.permissions.some((existing) => existing.id === p.id);
                  return (
                    <label key={p.id} className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setEditingRole({
                            ...editingRole,
                            permissions: checked
                              ? editingRole.permissions.filter((existing) => existing.id !== p.id)
                              : [...editingRole.permissions, p],
                          })
                        }
                      />
                      {p.name}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="form-actions">
              <Button type="submit" disabled={updateRoleMutation.isPending}>
                {updateRoleMutation.isPending ? t('common.saving') : t('common.save')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditingRole(null)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      {assigningUser && (
        <Modal title={`${t('pages.accessManagement.editRolesFor')} ${assigningUser.username}`} onClose={() => setAssigningUser(null)}>
          <form onSubmit={handleAssignRoles} className="form-grid">
            <div className="checkbox-group">
              {roles.map((r) => (
                <label key={r.id} className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={assignRoleIds.includes(r.id)}
                    onChange={() => setAssignRoleIds(toggleId(assignRoleIds, r.id))}
                  />
                  {r.label}
                </label>
              ))}
            </div>
            <div className="form-actions">
              <Button type="submit" disabled={assignRolesMutation.isPending}>
                {assignRolesMutation.isPending ? t('common.saving') : t('common.save')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setAssigningUser(null)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
