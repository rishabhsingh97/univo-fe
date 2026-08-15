import { apiClient } from '../client';
import type { TenantBrandingRequest, TenantBrandingResponse } from '../../types/branding';

export const brandingApi = {
  getForTenant: (tenantCode: string) =>
    apiClient
      .get<TenantBrandingResponse>('/api/public/tenant-branding', { params: { tenantCode } })
      .then((res) => res.data),

  update: (request: TenantBrandingRequest) =>
    apiClient.put<TenantBrandingResponse>('/api/admin/tenant-branding', request).then((res) => res.data),
};
