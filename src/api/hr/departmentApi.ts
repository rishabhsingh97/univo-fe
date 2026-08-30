import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { DepartmentRequest, DepartmentResponse } from '../../types/orgStructure';

const BASE = '/api/v1/hr/departments';

export const departmentApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<DepartmentResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  getById: (id: number) => apiClient.get<DepartmentResponse>(`${BASE}/${id}`).then((res) => res.data),

  create: (request: DepartmentRequest) => apiClient.post<DepartmentResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: DepartmentRequest) =>
    apiClient.put<DepartmentResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
