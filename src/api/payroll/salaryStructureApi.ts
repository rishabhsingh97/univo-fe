import { apiClient } from '../client';
import type { SalaryStructureRequest, SalaryStructureResponse } from '../../types/payroll';

export const salaryStructureApi = {
  list: () =>
    apiClient.get<SalaryStructureResponse[]>('/api/payroll/salary-structures').then((res) => res.data),

  create: (request: SalaryStructureRequest) =>
    apiClient
      .post<SalaryStructureResponse>('/api/payroll/salary-structures', request)
      .then((res) => res.data),

  update: (id: number, request: SalaryStructureRequest) =>
    apiClient
      .put<SalaryStructureResponse>(`/api/payroll/salary-structures/${id}`, request)
      .then((res) => res.data),
};
