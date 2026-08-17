import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { JobPostingRequest, JobPostingResponse } from '../../types/recruitment';

const BASE = '/api/v1/hr/job-postings';

export const jobPostingApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<JobPostingResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: JobPostingRequest) =>
    apiClient.post<JobPostingResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: JobPostingRequest) =>
    apiClient.put<JobPostingResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
