import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { TimeLogRequest, TimeLogResponse } from '../../types/timeTracker';

const BASE = '/api/v1/hr/time-logs';

export const timeLogApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<TimeLogResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: TimeLogRequest) => apiClient.post<TimeLogResponse>(BASE, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
