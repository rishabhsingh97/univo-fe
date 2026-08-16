import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { LoanAdvanceRequest, LoanAdvanceResponse, RequestStatusUpdateRequest } from '../../types/finance';

export const loanApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient
      .get<PageResponse<LoanAdvanceResponse>>('/api/finance/loans', { params: { page, size, sort } })
      .then((res) => res.data),

  create: (request: LoanAdvanceRequest) =>
    apiClient.post<LoanAdvanceResponse>('/api/finance/loans', request).then((res) => res.data),

  updateStatus: (id: number, request: RequestStatusUpdateRequest) =>
    apiClient.put<LoanAdvanceResponse>(`/api/finance/loans/${id}/status`, request).then((res) => res.data),
};
