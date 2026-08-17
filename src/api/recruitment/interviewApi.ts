import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { InterviewRequest, InterviewResponse } from '../../types/recruitment';

const BASE = '/api/v1/hr/interviews';

export const interviewApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<InterviewResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: InterviewRequest) =>
    apiClient.post<InterviewResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: InterviewRequest) =>
    apiClient.put<InterviewResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
