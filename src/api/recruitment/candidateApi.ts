import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { CandidateRequest, CandidateResponse } from '../../types/recruitment';

const BASE = '/api/v1/hr/candidates';

export const candidateApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<CandidateResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: CandidateRequest) =>
    apiClient.post<CandidateResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: CandidateRequest) =>
    apiClient.put<CandidateResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
