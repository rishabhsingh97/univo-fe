import { apiClient } from '../client';
import type { PermissionResponse, RoleRequest, RoleResponse } from '../../types/auth';

export const roleApi = {
  list: () => apiClient.get<RoleResponse[]>('/api/admin/roles').then((res) => res.data),

  getById: (id: number) => apiClient.get<RoleResponse>(`/api/admin/roles/${id}`).then((res) => res.data),

  create: (request: RoleRequest) =>
    apiClient.post<RoleResponse>('/api/admin/roles', request).then((res) => res.data),

  update: (id: number, request: RoleRequest) =>
    apiClient.put<RoleResponse>(`/api/admin/roles/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`/api/admin/roles/${id}`).then(() => undefined),

  listPermissions: () =>
    apiClient.get<PermissionResponse[]>('/api/admin/permissions').then((res) => res.data),
};
