import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { TravelRequest, TravelResponse, TravelStatusUpdateRequest } from '../../types/travel';

const BASE = '/api/v1/hr/travel';

export const travelApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<TravelResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: TravelRequest) => apiClient.post<TravelResponse>(BASE, request).then((res) => res.data),

  updateStatus: (id: number, request: TravelStatusUpdateRequest) =>
    apiClient.put<TravelResponse>(`${BASE}/${id}/status`, request).then((res) => res.data),
};
