import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { AssignRolesRequest, CreateUserRequest, UserCreateResponse, UserResponse } from '../../types/auth';

export const userApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient
      .get<PageResponse<UserResponse>>('/api/admin/users', { params: { page, size, sort } })
      .then((res) => res.data),

  getById: (id: number) => apiClient.get<UserResponse>(`/api/admin/users/${id}`).then((res) => res.data),

  create: (request: CreateUserRequest) =>
    apiClient.post<UserCreateResponse>('/api/admin/users', request).then((res) => res.data),

  assignRoles: (id: number, request: AssignRolesRequest) =>
    apiClient.put<UserResponse>(`/api/admin/users/${id}/roles`, request).then((res) => res.data),
};
