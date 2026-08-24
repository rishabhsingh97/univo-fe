import { apiClient } from '../client';
import type { SystemStatusResponse } from '../../types/platform';

const BASE = '/api/platform/system-status';

export const platformStatusApi = {
  get: () => apiClient.get<SystemStatusResponse>(BASE).then((res) => res.data),
};
