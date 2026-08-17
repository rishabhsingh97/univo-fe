import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type {
  ReimbursementRequest,
  ReimbursementResponse,
  RequestStatusUpdateRequest,
} from '../../types/finance';

const BASE = '/api/v1/finance/reimbursements';

export const reimbursementApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<ReimbursementResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: ReimbursementRequest) =>
    apiClient.post<ReimbursementResponse>(BASE, request).then((res) => res.data),

  updateStatus: (id: number, request: RequestStatusUpdateRequest) =>
    apiClient.put<ReimbursementResponse>(`${BASE}/${id}/status`, request).then((res) => res.data),
};
