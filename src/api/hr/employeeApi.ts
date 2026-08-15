import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { EmployeeRequest, EmployeeResponse } from '../../types/hr';

export const employeeApi = {
  list: (page = 0, size = 20) =>
    apiClient
      .get<PageResponse<EmployeeResponse>>('/api/hr/employees', { params: { page, size } })
      .then((res) => res.data),

  getById: (id: number) =>
    apiClient.get<EmployeeResponse>(`/api/hr/employees/${id}`).then((res) => res.data),

  create: (request: EmployeeRequest) =>
    apiClient.post<EmployeeResponse>('/api/hr/employees', request).then((res) => res.data),

  update: (id: number, request: EmployeeRequest) =>
    apiClient.put<EmployeeResponse>(`/api/hr/employees/${id}`, request).then((res) => res.data),

  deactivate: (id: number) => apiClient.delete<void>(`/api/hr/employees/${id}`).then(() => undefined),
};
