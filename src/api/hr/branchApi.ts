import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { BranchRequest, BranchResponse } from '../../types/orgStructure';

const BASE = '/api/v1/hr/branches';

export const branchApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<BranchResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  getById: (id: number) => apiClient.get<BranchResponse>(`${BASE}/${id}`).then((res) => res.data),

  create: (request: BranchRequest) => apiClient.post<BranchResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: BranchRequest) =>
    apiClient.put<BranchResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
