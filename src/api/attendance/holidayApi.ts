import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { HolidayRequest, HolidayResponse } from '../../types/attendance';

const BASE = '/api/v1/hr/holidays';

export const holidayApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<HolidayResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: HolidayRequest) => apiClient.post<HolidayResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: HolidayRequest) =>
    apiClient.put<HolidayResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
