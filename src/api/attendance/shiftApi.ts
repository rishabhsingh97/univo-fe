import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { ShiftRequest, ShiftResponse } from '../../types/attendance';

const BASE = '/api/v1/hr/shifts';

export const shiftApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<ShiftResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: ShiftRequest) => apiClient.post<ShiftResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: ShiftRequest) =>
    apiClient.put<ShiftResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
