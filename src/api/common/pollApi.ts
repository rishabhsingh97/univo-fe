import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { PollRequest, PollResponse, PollVoteRequest } from '../../types/engagement';

const BASE = '/api/polls';

export const pollApi = {
  list: (page = 0, size = 20) =>
    apiClient.get<PageResponse<PollResponse>>(BASE, { params: { page, size } }).then((res) => res.data),

  create: (request: PollRequest) => apiClient.post<PollResponse>(BASE, request).then((res) => res.data),

  vote: (id: number, request: PollVoteRequest) =>
    apiClient.post<PollResponse>(`${BASE}/${id}/vote`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
