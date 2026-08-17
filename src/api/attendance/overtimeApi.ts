import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { ApprovalStatusUpdateRequest, OvertimeRequest, OvertimeResponse } from '../../types/attendance';

const BASE = '/api/v1/hr/overtime-records';

export const overtimeApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<OvertimeResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: OvertimeRequest) => apiClient.post<OvertimeResponse>(BASE, request).then((res) => res.data),

  updateStatus: (id: number, request: ApprovalStatusUpdateRequest) =>
    apiClient.put<OvertimeResponse>(`${BASE}/${id}/status`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
