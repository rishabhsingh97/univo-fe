import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { CreateTenantRequest, TenantSummaryResponse, UpdateTenantModulesRequest, UpdateTenantStatusRequest } from '../../types/platform';

const BASE = '/api/platform/tenants';

export const platformTenantApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<TenantSummaryResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: CreateTenantRequest) =>
    apiClient.post<TenantSummaryResponse>(BASE, request).then((res) => res.data),

  updateStatus: (id: number, request: UpdateTenantStatusRequest) =>
    apiClient.put<TenantSummaryResponse>(`${BASE}/${id}/status`, request).then((res) => res.data),

  updateModules: (id: number, request: UpdateTenantModulesRequest) =>
    apiClient.put<TenantSummaryResponse>(`${BASE}/${id}/modules`, request).then((res) => res.data),

  moduleKeys: () => apiClient.get<string[]>(`${BASE}/module-keys`).then((res) => res.data),
};
