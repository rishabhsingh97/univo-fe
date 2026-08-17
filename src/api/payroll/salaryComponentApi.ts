import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { SalaryComponentRequest, SalaryComponentResponse } from '../../types/payroll';

const BASE = '/api/v1/hr/salary-components';

export const salaryComponentApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient
      .get<PageResponse<SalaryComponentResponse>>(BASE, { params: { page, size, sort } })
      .then((res) => res.data),

  create: (request: SalaryComponentRequest) =>
    apiClient.post<SalaryComponentResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: SalaryComponentRequest) =>
    apiClient.put<SalaryComponentResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
