import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { FullFinalRequest, FullFinalResponse, FullFinalStatusUpdateRequest } from '../../types/fullFinal';

const BASE = '/api/v1/hr/full-final-settlements';

export const fullFinalApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<FullFinalResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  getById: (id: number) => apiClient.get<FullFinalResponse>(`${BASE}/${id}`).then((res) => res.data),

  create: (request: FullFinalRequest) =>
    apiClient.post<FullFinalResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: FullFinalRequest) =>
    apiClient.put<FullFinalResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  updateStatus: (id: number, request: FullFinalStatusUpdateRequest) =>
    apiClient.put<FullFinalResponse>(`${BASE}/${id}/status`, request).then((res) => res.data),
};
