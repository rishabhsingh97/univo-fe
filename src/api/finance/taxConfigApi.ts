import { apiClient } from '../client';
import type { TaxConfigRequest, TaxConfigResponse } from '../../types/finance';

export const taxConfigApi = {
  list: () => apiClient.get<TaxConfigResponse[]>('/api/finance/tax-config').then((res) => res.data),

  create: (request: TaxConfigRequest) =>
    apiClient.post<TaxConfigResponse>('/api/finance/tax-config', request).then((res) => res.data),

  update: (id: number, request: TaxConfigRequest) =>
    apiClient.put<TaxConfigResponse>(`/api/finance/tax-config/${id}`, request).then((res) => res.data),
};
