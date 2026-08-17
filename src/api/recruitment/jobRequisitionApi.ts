import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { JobRequisitionRequest, JobRequisitionResponse } from '../../types/recruitment';

const BASE = '/api/v1/hr/job-requisitions';

export const jobRequisitionApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient
      .get<PageResponse<JobRequisitionResponse>>(BASE, { params: { page, size, sort } })
      .then((res) => res.data),

  create: (request: JobRequisitionRequest) =>
    apiClient.post<JobRequisitionResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: JobRequisitionRequest) =>
    apiClient.put<JobRequisitionResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
