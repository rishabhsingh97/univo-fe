import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { DesignationRequest, DesignationResponse } from '../../types/hr';

const BASE = '/api/hr/designations';

export const designationApi = {
  list: (page = 0, size = 50, sort?: string) =>
    apiClient.get<PageResponse<DesignationResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  getById: (id: number) => apiClient.get<DesignationResponse>(`${BASE}/${id}`).then((res) => res.data),

  create: (request: DesignationRequest) => apiClient.post<DesignationResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: DesignationRequest) =>
    apiClient.put<DesignationResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
