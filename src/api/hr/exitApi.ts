import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type {
  ClearanceItemUpdateRequest,
  ExitRequest,
  ExitResponse,
  ExitStatusUpdateRequest,
} from '../../types/exit';

const BASE = '/api/v1/hr/exits';

export const exitApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<ExitResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  getById: (id: number) => apiClient.get<ExitResponse>(`${BASE}/${id}`).then((res) => res.data),

  create: (request: ExitRequest) => apiClient.post<ExitResponse>(BASE, request).then((res) => res.data),

  updateStatus: (id: number, request: ExitStatusUpdateRequest) =>
    apiClient.put<ExitResponse>(`${BASE}/${id}/status`, request).then((res) => res.data),

  updateClearanceItem: (exitId: number, itemId: number, request: ClearanceItemUpdateRequest) =>
    apiClient.put<ExitResponse>(`${BASE}/${exitId}/clearance-items/${itemId}`, request).then((res) => res.data),

  complete: (id: number) => apiClient.post<ExitResponse>(`${BASE}/${id}/complete`).then((res) => res.data),
};
