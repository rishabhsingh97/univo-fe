import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { OrgUnitRequest, OrgUnitResponse } from '../../types/hr';

export const orgUnitApi = {
  list: (page = 0, size = 20) =>
    apiClient
      .get<PageResponse<OrgUnitResponse>>('/api/hr/org-units', { params: { page, size } })
      .then((res) => res.data),

  getById: (id: number) =>
    apiClient.get<OrgUnitResponse>(`/api/hr/org-units/${id}`).then((res) => res.data),

  create: (request: OrgUnitRequest) =>
    apiClient.post<OrgUnitResponse>('/api/hr/org-units', request).then((res) => res.data),

  update: (id: number, request: OrgUnitRequest) =>
    apiClient.put<OrgUnitResponse>(`/api/hr/org-units/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`/api/hr/org-units/${id}`).then(() => undefined),
};
