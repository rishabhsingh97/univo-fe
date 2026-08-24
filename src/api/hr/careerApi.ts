import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { CareerActionRequest, CareerActionResponse, CareerActionStatusUpdateRequest } from '../../types/career';

const BASE = '/api/v1/hr/career-actions';

export const careerApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<CareerActionResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: CareerActionRequest) =>
    apiClient.post<CareerActionResponse>(BASE, request).then((res) => res.data),

  updateStatus: (id: number, request: CareerActionStatusUpdateRequest) =>
    apiClient.put<CareerActionResponse>(`${BASE}/${id}/status`, request).then((res) => res.data),
};
