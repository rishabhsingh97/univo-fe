import { apiClient } from '../client';
import type { SubdomainAvailability, TenantByDomain, TenantDomain } from '../../types/domain';

export const domainApi = {
  checkSubdomainAvailability: (subdomain: string) =>
    apiClient
      .get<SubdomainAvailability>('/api/public/subdomain-availability', { params: { subdomain } })
      .then((res) => res.data.available),

  suggestSubdomain: (companyName: string) =>
    apiClient
      .get<{ subdomain: string }>('/api/public/suggest-subdomain', { params: { companyName } })
      .then((res) => res.data.subdomain),

  /** Returns null (not a rejection) for a 404 - an unrecognized domain is an expected, common
   * case here (e.g. the bare marketing domain, or a subdomain nobody's claimed), not an error. */
  resolveTenantByDomain: (domain: string) =>
    apiClient
      .get<TenantByDomain>('/api/public/tenant-by-domain', { params: { domain } })
      .then((res) => res.data.tenantCode)
      .catch((err) => {
        if (err.response?.status === 404) return null;
        throw err;
      }),

  list: () => apiClient.get<TenantDomain[]>('/api/tenant/domains').then((res) => res.data),

  claimSubdomain: (subdomain: string) =>
    apiClient.put<TenantDomain>('/api/tenant/domains/subdomain', { subdomain }).then((res) => res.data),

  addCustomDomain: (domain: string) =>
    apiClient.post<TenantDomain>('/api/tenant/domains', { domain }).then((res) => res.data),

  verify: (id: number) => apiClient.post<TenantDomain>(`/api/tenant/domains/${id}/verify`).then((res) => res.data),

  remove: (id: number) => apiClient.delete(`/api/tenant/domains/${id}`),
};
