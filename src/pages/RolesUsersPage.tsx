import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roleApi } from '../api/admin/roleApi';
import { userApi } from '../api/admin/userApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Modal, PagedDataTable, PillList, TextField, statusTone } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { CreateUserRequest, RoleRequest, RoleResponse, UserCreateResponse, UserResponse } from '../types/auth';

function emptyRoleForm(): RoleRequest {
  return { name: '', label: '', description: '', permissionIds: [] };
}

function emptyUserForm(): CreateUserRequest {
  return { email: '', fullName: '', roleIds: [] };
}

function toggleId(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id];
}

/** No title of its own - only rendered as a tab inside AdministrationPage, whose tab label
 * already says "Roles". Roles and Users used to be one page with an internal toggle; they're
 * independent enough (neither needs the other's data) to be two flat tabs instead. */
export function RolesManagementPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<RoleRequest>(emptyRoleForm());
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null);
  const [viewingPermissionsFor, setViewingPermissionsFor] = useState<RoleResponse | null>(null);

  const canManageRoles = hasPermission('admin.role.manage');

  const permissionsQuery = useQuery({ queryKey: ['permissions'], queryFn: () => roleApi.listPermissions(0, 200) });
  const permissions = permissionsQuery.data?.content ?? [];

  const invalidateRoles = () => queryClient.invalidateQueries({ queryKey: ['roles'] });

  const createRoleMutation = useMutation({
    mutationFn: (request: RoleRequest) => roleApi.create(request),
    onSuccess: () => {
      invalidateRoles();
      setForm(emptyRoleForm());
      setShowCreateRole(false);
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

  const roleColumns: DataTableColumn<RoleResponse>[] = [
    { key: 'label', header: t('fields.label'), render: (r) => r.label, sortKey: 'label' },
    { key: 'description', header: t('fields.description'), render: (r) => r.description ?? '-' },
    {
      key: 'permissions',
      header: t('fields.permissions'),
      render: (r) => (
        <Button variant="secondary" onClick={() => setViewingPermissionsFor(r)}>
          {t('pages.accessManagement.viewPermissions').replace('{count}', String(r.permissions.length))}
        </Button>
      ),
    },
  ];

  return (
    <div>
      {canManageRoles && (
        <div className="row-actions" style={{ justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button onClick={() => setShowCreateRole(true)}>{t('pages.accessManagement.addRole')}</Button>
        </div>
      )}

      <PagedDataTable
        columns={roleColumns}
        queryKey={['roles']}
        fetchPage={roleApi.list}
        getRowKey={(r) => r.id}
        onEdit={canManageRoles ? (r) => setEditingRole(r) : undefined}
        onDelete={canManageRoles ? (r) => deleteRoleMutation.mutate(r.id) : undefined}
      />

      {showCreateRole && (
        <Modal title={t('pages.accessManagement.createRole')} onClose={() => setShowCreateRole(false)}>
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
              <Button type="button" variant="secondary" onClick={() => setShowCreateRole(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
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

      {viewingPermissionsFor && (
        <Modal
          title={`${t('fields.permissions')} – ${viewingPermissionsFor.label}`}
          onClose={() => setViewingPermissionsFor(null)}
        >
          {viewingPermissionsFor.permissions.length > 0 ? (
            <PillList items={viewingPermissionsFor.permissions.map((p) => p.name)} />
          ) : (
            <p>{t('pages.accessManagement.noPermissions')}</p>
          )}
          <div className="form-actions" style={{ marginTop: 16 }}>
            <Button type="button" onClick={() => setViewingPermissionsFor(null)}>{t('common.close')}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/** No title of its own - only rendered as a tab inside AdministrationPage, whose tab label
 * already says "Users". See RolesManagementPage above for why this split from one page. */
export function UsersManagementPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [assigningUser, setAssigningUser] = useState<UserResponse | null>(null);
  const [assignRoleIds, setAssignRoleIds] = useState<number[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserRequest>(emptyUserForm());
  const [createdUser, setCreatedUser] = useState<UserCreateResponse | null>(null);

  const canManageUsers = hasPermission('admin.user.manage');

  // Every role, not just one page of it - the "assign roles to user" and "create user" modals
  // both need every option.
  const allRolesQuery = useQuery({ queryKey: ['roles', 'select'], queryFn: () => roleApi.list(0, 200) });
  const roles = allRolesQuery.data?.content ?? [];

  const assignRolesMutation = useMutation({
    mutationFn: ({ id, roleIds }: { id: number; roleIds: number[] }) => userApi.assignRoles(id, { roleIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setAssigningUser(null);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (request: CreateUserRequest) => userApi.create(request),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateUser(false);
      setCreateForm(emptyUserForm());
      setCreatedUser(response);
    },
  });

  const handleCreateUser = (event: FormEvent) => {
    event.preventDefault();
    createUserMutation.mutate(createForm);
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

  const userColumns: DataTableColumn<UserResponse>[] = [
    { key: 'email', header: t('fields.email'), render: (u) => u.email, sortKey: 'email' },
    { key: 'roles', header: t('nav.roles'), render: (u) => <PillList items={u.roles.map((r) => r.label)} /> },
    {
      key: 'status',
      header: t('fields.status'),
      render: (u) => <Badge tone={statusTone(u.status)}>{u.status}</Badge>,
      sortKey: 'status',
    },
  ];

  return (
    <div>
      {canManageUsers && (
        <div className="row-actions" style={{ justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button onClick={() => setShowCreateUser(true)}>{t('pages.accessManagement.addUser')}</Button>
        </div>
      )}

      <PagedDataTable
        columns={userColumns}
        queryKey={['users']}
        fetchPage={userApi.list}
        getRowKey={(u) => u.id}
        onEdit={canManageUsers ? (u) => openAssign(u) : undefined}
      />

      {showCreateUser && (
        <Modal title={t('pages.accessManagement.createUser')} onClose={() => setShowCreateUser(false)}>
          <form onSubmit={handleCreateUser} className="form-grid">
            <TextField
              label={t('fields.email')}
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              required
            />
            <TextField
              label={t('fields.fullName')}
              value={createForm.fullName ?? ''}
              onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
            />
            <div className="field">
              <span className="field-label">{t('nav.roles')}</span>
              <div className="checkbox-group">
                {roles.map((r) => (
                  <label key={r.id} className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={createForm.roleIds.includes(r.id)}
                      onChange={() => setCreateForm({ ...createForm, roleIds: toggleId(createForm.roleIds, r.id) })}
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreateUser(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      {createdUser && (
        <Modal title={t('pages.accessManagement.userCreated')} onClose={() => setCreatedUser(null)}>
          <p>{t('pages.accessManagement.userCreatedHint')}</p>
          <TextField label={t('fields.email')} value={createdUser.user.email} readOnly />
          <TextField label={t('fields.temporaryPassword')} value={createdUser.temporaryPassword} readOnly />
          <div className="form-actions">
            <Button type="button" onClick={() => setCreatedUser(null)}>{t('common.close')}</Button>
          </div>
        </Modal>
      )}

      {assigningUser && (
        <Modal title={`${t('pages.accessManagement.editRolesFor')} ${assigningUser.email}`} onClose={() => setAssigningUser(null)}>
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
