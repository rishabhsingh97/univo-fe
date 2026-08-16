import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { AttendanceRequest, AttendanceResponse, AttendanceTodaySummary } from '../../types/attendance';

const BASE = '/api/v1/hr/records';

export const attendanceApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<AttendanceResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  todaySummary: () => apiClient.get<AttendanceTodaySummary>(`${BASE}/today-summary`).then((res) => res.data),

  create: (request: AttendanceRequest) => apiClient.post<AttendanceResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: AttendanceRequest) =>
    apiClient.put<AttendanceResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
