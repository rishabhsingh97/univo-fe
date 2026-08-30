import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { JobCategoryRequest, JobCategoryResponse } from '../../types/orgStructure';

const BASE = '/api/v1/hr/job-categories';

export const jobCategoryApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<JobCategoryResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  getById: (id: number) => apiClient.get<JobCategoryResponse>(`${BASE}/${id}`).then((res) => res.data),

  create: (request: JobCategoryRequest) => apiClient.post<JobCategoryResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: JobCategoryRequest) =>
    apiClient.put<JobCategoryResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
