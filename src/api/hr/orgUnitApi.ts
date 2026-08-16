import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { OrgUnitRequest, OrgUnitResponse } from '../../types/hr';

const BASE = '/api/v1/hr/org-units';

export const orgUnitApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<OrgUnitResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  getById: (id: number) => apiClient.get<OrgUnitResponse>(`${BASE}/${id}`).then((res) => res.data),

  create: (request: OrgUnitRequest) => apiClient.post<OrgUnitResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: OrgUnitRequest) =>
    apiClient.put<OrgUnitResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
