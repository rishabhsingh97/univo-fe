import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { SalaryStructureRequest, SalaryStructureResponse } from '../../types/payroll';

const BASE = '/api/v1/hr/salary-structures';

export const salaryStructureApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient
      .get<PageResponse<SalaryStructureResponse>>(BASE, { params: { page, size, sort } })
      .then((res) => res.data),

  create: (request: SalaryStructureRequest) =>
    apiClient.post<SalaryStructureResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: SalaryStructureRequest) =>
    apiClient.put<SalaryStructureResponse>(`${BASE}/${id}`, request).then((res) => res.data),
};
