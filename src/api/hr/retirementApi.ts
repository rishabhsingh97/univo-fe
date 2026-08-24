import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { RetirementRequest, RetirementResponse, RetirementStatusUpdateRequest } from '../../types/retirement';

const BASE = '/api/v1/hr/retirements';

export const retirementApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<RetirementResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: RetirementRequest) =>
    apiClient.post<RetirementResponse>(BASE, request).then((res) => res.data),

  updateStatus: (id: number, request: RetirementStatusUpdateRequest) =>
    apiClient.put<RetirementResponse>(`${BASE}/${id}/status`, request).then((res) => res.data),
};
