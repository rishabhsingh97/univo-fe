import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type {
  LeaveApplicationRequest,
  LeaveApplicationResponse,
  LeavePendingCount,
  LeaveStatusUpdateRequest,
} from '../../types/attendance';

const BASE = '/api/v1/hr/leave-applications';

export const leaveApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient
      .get<PageResponse<LeaveApplicationResponse>>(BASE, {
        params: { page, size, sort },
      })
      .then((res) => res.data),

  pendingCount: () => apiClient.get<LeavePendingCount>(`${BASE}/pending-count`).then((res) => res.data),

  create: (request: LeaveApplicationRequest) =>
    apiClient.post<LeaveApplicationResponse>(BASE, request).then((res) => res.data),

  updateStatus: (id: number, request: LeaveStatusUpdateRequest) =>
    apiClient.put<LeaveApplicationResponse>(`${BASE}/${id}/status`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
