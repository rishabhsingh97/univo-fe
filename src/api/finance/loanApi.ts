import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { LoanAdvanceRequest, LoanAdvanceResponse, RequestStatusUpdateRequest } from '../../types/finance';

const BASE = '/api/v1/finance/loans';

export const loanApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<LoanAdvanceResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: LoanAdvanceRequest) => apiClient.post<LoanAdvanceResponse>(BASE, request).then((res) => res.data),

  updateStatus: (id: number, request: RequestStatusUpdateRequest) =>
    apiClient.put<LoanAdvanceResponse>(`${BASE}/${id}/status`, request).then((res) => res.data),
};
