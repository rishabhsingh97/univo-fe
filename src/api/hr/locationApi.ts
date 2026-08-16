import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { LocationRequest, LocationResponse } from '../../types/hr';

const BASE = '/api/v1/hr/locations';

export const locationApi = {
  list: (page = 0, size = 50, sort?: string) =>
    apiClient.get<PageResponse<LocationResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  getById: (id: number) => apiClient.get<LocationResponse>(`${BASE}/${id}`).then((res) => res.data),

  create: (request: LocationRequest) => apiClient.post<LocationResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: LocationRequest) =>
    apiClient.put<LocationResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
