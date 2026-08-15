import { apiClient } from '../client';
import type { HolidayRequest, HolidayResponse } from '../../types/attendance';

export const holidayApi = {
  list: () => apiClient.get<HolidayResponse[]>('/api/attendance/holidays').then((res) => res.data),

  create: (request: HolidayRequest) =>
    apiClient.post<HolidayResponse>('/api/attendance/holidays', request).then((res) => res.data),

  update: (id: number, request: HolidayRequest) =>
    apiClient.put<HolidayResponse>(`/api/attendance/holidays/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`/api/attendance/holidays/${id}`).then(() => undefined),
};
