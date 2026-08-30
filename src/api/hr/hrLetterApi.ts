import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { GenerateLetterRequest, GeneratedLetterResponse } from '../../types/hrLetters';

const BASE = '/api/v1/hr/hr-letters';

export const hrLetterApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<GeneratedLetterResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  generate: (request: GenerateLetterRequest) =>
    apiClient.post<GeneratedLetterResponse>(BASE, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
