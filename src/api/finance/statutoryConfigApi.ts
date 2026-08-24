import { apiClient } from '../client';
import type { StatutoryConfigRequest, StatutoryConfigResponse } from '../../types/finance';

const BASE = '/api/v1/finance/statutory-config';

export const statutoryConfigApi = {
  get: () => apiClient.get<StatutoryConfigResponse>(BASE).then((res) => res.data),

  update: (request: StatutoryConfigRequest) =>
    apiClient.put<StatutoryConfigResponse>(BASE, request).then((res) => res.data),
};
