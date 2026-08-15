import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type {
  LeaveApplicationRequest,
  LeaveApplicationResponse,
  LeavePendingCount,
  LeaveStatusUpdateRequest,
} from '../../types/attendance';

export const leaveApi = {
  list: (page = 0, size = 20) =>
    apiClient
      .get<PageResponse<LeaveApplicationResponse>>('/api/attendance/leave-applications', {
        params: { page, size },
      })
      .then((res) => res.data),

  pendingCount: () =>
    apiClient
      .get<LeavePendingCount>('/api/attendance/leave-applications/pending-count')
      .then((res) => res.data),

  create: (request: LeaveApplicationRequest) =>
    apiClient
      .post<LeaveApplicationResponse>('/api/attendance/leave-applications', request)
      .then((res) => res.data),

  updateStatus: (id: number, request: LeaveStatusUpdateRequest) =>
    apiClient
      .put<LeaveApplicationResponse>(`/api/attendance/leave-applications/${id}/status`, request)
      .then((res) => res.data),

  delete: (id: number) =>
    apiClient.delete<void>(`/api/attendance/leave-applications/${id}`).then(() => undefined),
};
