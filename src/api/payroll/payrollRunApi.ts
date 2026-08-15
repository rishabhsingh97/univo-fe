import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { PayrollRunRequest, PayrollRunResponse, PayslipResponse } from '../../types/payroll';

export const payrollRunApi = {
  list: () => apiClient.get<PayrollRunResponse[]>('/api/payroll/runs').then((res) => res.data),

  create: (request: PayrollRunRequest) =>
    apiClient.post<PayrollRunResponse>('/api/payroll/runs', request).then((res) => res.data),

  process: (id: number) =>
    apiClient.post<PayrollRunResponse>(`/api/payroll/runs/${id}/process`).then((res) => res.data),

  payslipsForRun: (id: number, page = 0, size = 20) =>
    apiClient
      .get<PageResponse<PayslipResponse>>(`/api/payroll/runs/${id}/payslips`, { params: { page, size } })
      .then((res) => res.data),

  payslipsForEmployee: (employeeId: number, page = 0, size = 20) =>
    apiClient
      .get<PageResponse<PayslipResponse>>(`/api/payroll/employees/${employeeId}/payslips`, {
        params: { page, size },
      })
      .then((res) => res.data),
};
