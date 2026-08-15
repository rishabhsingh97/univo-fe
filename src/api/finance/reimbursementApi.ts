import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type {
  ReimbursementRequest,
  ReimbursementResponse,
  RequestStatusUpdateRequest,
} from '../../types/finance';

export const reimbursementApi = {
  list: (page = 0, size = 20) =>
    apiClient
      .get<PageResponse<ReimbursementResponse>>('/api/finance/reimbursements', { params: { page, size } })
      .then((res) => res.data),

  create: (request: ReimbursementRequest) =>
    apiClient.post<ReimbursementResponse>('/api/finance/reimbursements', request).then((res) => res.data),

  updateStatus: (id: number, request: RequestStatusUpdateRequest) =>
    apiClient
      .put<ReimbursementResponse>(`/api/finance/reimbursements/${id}/status`, request)
      .then((res) => res.data),
};
