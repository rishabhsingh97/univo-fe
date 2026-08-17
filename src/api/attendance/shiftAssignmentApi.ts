import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { ShiftAssignmentRequest, ShiftAssignmentResponse } from '../../types/attendance';

const BASE = '/api/v1/hr/shift-assignments';

export const shiftAssignmentApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<ShiftAssignmentResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  listForEmployee: (employeeId: number, page = 0, size = 20) =>
    apiClient
      .get<PageResponse<ShiftAssignmentResponse>>(`${BASE}/by-employee/${employeeId}`, { params: { page, size } })
      .then((res) => res.data),

  create: (request: ShiftAssignmentRequest) =>
    apiClient.post<ShiftAssignmentResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: ShiftAssignmentRequest) =>
    apiClient.put<ShiftAssignmentResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
