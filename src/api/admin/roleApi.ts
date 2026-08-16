import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { PermissionResponse, RoleRequest, RoleResponse } from '../../types/auth';

const BASE = '/api/admin/roles';

export const roleApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<RoleResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  getById: (id: number) => apiClient.get<RoleResponse>(`${BASE}/${id}`).then((res) => res.data),

  create: (request: RoleRequest) => apiClient.post<RoleResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: RoleRequest) =>
    apiClient.put<RoleResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),

  listPermissions: (page = 0, size = 200, sort?: string) =>
    apiClient
      .get<PageResponse<PermissionResponse>>('/api/admin/permissions', { params: { page, size, sort } })
      .then((res) => res.data),
};
