import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { PayrollRunRequest, PayrollRunResponse, PayslipResponse } from '../../types/payroll';

const BASE = '/api/v1/hr/runs';

export const payrollRunApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<PayrollRunResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: PayrollRunRequest) => apiClient.post<PayrollRunResponse>(BASE, request).then((res) => res.data),

  process: (id: number) => apiClient.post<PayrollRunResponse>(`${BASE}/${id}/process`).then((res) => res.data),

  payslipsForRun: (id: number, page = 0, size = 20, sort?: string) =>
    apiClient
      .get<PageResponse<PayslipResponse>>(`${BASE}/${id}/payslips`, { params: { page, size, sort } })
      .then((res) => res.data),

  payslipsForEmployee: (employeeId: number, page = 0, size = 20, sort?: string) =>
    apiClient
      .get<PageResponse<PayslipResponse>>(`/api/v1/hr/employees/${employeeId}/payslips`, {
        params: { page, size, sort },
      })
      .then((res) => res.data),
};
