import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { AttendanceRequest, AttendanceResponse } from '../../types/attendance';

export const attendanceApi = {
  list: (page = 0, size = 20) =>
    apiClient
      .get<PageResponse<AttendanceResponse>>('/api/attendance/records', { params: { page, size } })
      .then((res) => res.data),

  create: (request: AttendanceRequest) =>
    apiClient.post<AttendanceResponse>('/api/attendance/records', request).then((res) => res.data),

  update: (id: number, request: AttendanceRequest) =>
    apiClient.put<AttendanceResponse>(`/api/attendance/records/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`/api/attendance/records/${id}`).then(() => undefined),
};
