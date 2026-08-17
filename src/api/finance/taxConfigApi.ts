import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { TaxConfigRequest, TaxConfigResponse } from '../../types/finance';

const BASE = '/api/v1/finance/tax-config';

export const taxConfigApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<TaxConfigResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: TaxConfigRequest) => apiClient.post<TaxConfigResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: TaxConfigRequest) =>
    apiClient.put<TaxConfigResponse>(`${BASE}/${id}`, request).then((res) => res.data),
};
