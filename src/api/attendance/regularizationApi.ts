import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type {
  ApprovalStatusUpdateRequest,
  AttendanceRegularizationRequest,
  AttendanceRegularizationResponse,
} from '../../types/attendance';

const BASE = '/api/v1/hr/attendance-regularizations';

export const regularizationApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient
      .get<PageResponse<AttendanceRegularizationResponse>>(BASE, { params: { page, size, sort } })
      .then((res) => res.data),

  create: (request: AttendanceRegularizationRequest) =>
    apiClient.post<AttendanceRegularizationResponse>(BASE, request).then((res) => res.data),

  updateStatus: (id: number, request: ApprovalStatusUpdateRequest) =>
    apiClient.put<AttendanceRegularizationResponse>(`${BASE}/${id}/status`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
