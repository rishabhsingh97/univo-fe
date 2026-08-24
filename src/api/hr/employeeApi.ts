import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type {
  EmployeeFilterOptionsResponse,
  EmployeeRequest,
  EmployeeResponse,
  GenerateCredentialsResponse,
  ReassignManagerRequest,
} from '../../types/hr';

const BASE = '/api/v1/hr/employees';

export const employeeApi = {
  list: (page = 0, size = 20, sort?: string, filters?: Record<string, string>) =>
    apiClient.get<PageResponse<EmployeeResponse>>(BASE, { params: { page, size, sort, ...filters } }).then((res) => res.data),

  getFilterOptions: () =>
    apiClient.get<EmployeeFilterOptionsResponse>(`${BASE}/filter-options`).then((res) => res.data),

  getById: (id: number) => apiClient.get<EmployeeResponse>(`${BASE}/${id}`).then((res) => res.data),

  create: (request: EmployeeRequest) => apiClient.post<EmployeeResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: EmployeeRequest) =>
    apiClient.put<EmployeeResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  deactivate: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),

  directReports: (id: number, page = 0, size = 50) =>
    apiClient
      .get<PageResponse<EmployeeResponse>>(`${BASE}/${id}/direct-reports`, { params: { page, size } })
      .then((res) => res.data),

  roots: (page = 0, size = 50) =>
    apiClient.get<PageResponse<EmployeeResponse>>(`${BASE}/roots`, { params: { page, size } }).then((res) => res.data),

  reassignManager: (id: number, request: ReassignManagerRequest) =>
    apiClient.put<EmployeeResponse>(`${BASE}/${id}/manager`, request).then((res) => res.data),

  generateCredentials: (id: number) =>
    apiClient.post<GenerateCredentialsResponse>(`${BASE}/${id}/generate-credentials`).then((res) => res.data),

  resetPassword: (id: number) =>
    apiClient.post<GenerateCredentialsResponse>(`${BASE}/${id}/reset-password`).then((res) => res.data),
};
