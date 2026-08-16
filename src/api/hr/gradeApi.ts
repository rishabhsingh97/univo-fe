import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { GradeRequest, GradeResponse } from '../../types/hr';

const BASE = '/api/hr/grades';

export const gradeApi = {
  list: (page = 0, size = 50, sort?: string) =>
    apiClient.get<PageResponse<GradeResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  getById: (id: number) => apiClient.get<GradeResponse>(`${BASE}/${id}`).then((res) => res.data),

  create: (request: GradeRequest) => apiClient.post<GradeResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: GradeRequest) =>
    apiClient.put<GradeResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
