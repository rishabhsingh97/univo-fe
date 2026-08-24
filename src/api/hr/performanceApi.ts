import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { AppraisalRequest, AppraisalResponse, GoalRequest, GoalResponse } from '../../types/performance';

const GOALS_BASE = '/api/v1/hr/performance/goals';
const APPRAISALS_BASE = '/api/v1/hr/performance/appraisals';

export const goalApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<GoalResponse>>(GOALS_BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: GoalRequest) => apiClient.post<GoalResponse>(GOALS_BASE, request).then((res) => res.data),

  update: (id: number, request: GoalRequest) =>
    apiClient.put<GoalResponse>(`${GOALS_BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${GOALS_BASE}/${id}`).then(() => undefined),
};

export const appraisalApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<AppraisalResponse>>(APPRAISALS_BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: AppraisalRequest) =>
    apiClient.post<AppraisalResponse>(APPRAISALS_BASE, request).then((res) => res.data),

  update: (id: number, request: AppraisalRequest) =>
    apiClient.put<AppraisalResponse>(`${APPRAISALS_BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${APPRAISALS_BASE}/${id}`).then(() => undefined),
};
