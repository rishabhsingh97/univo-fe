import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { OnboardingRecordRequest, OnboardingRecordResponse, OnboardingTaskRequest } from '../../types/onboarding';

const BASE = '/api/v1/hr/onboarding-records';

export const onboardingApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<OnboardingRecordResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: OnboardingRecordRequest) =>
    apiClient.post<OnboardingRecordResponse>(BASE, request).then((res) => res.data),

  addTask: (id: number, request: OnboardingTaskRequest) =>
    apiClient.post<OnboardingRecordResponse>(`${BASE}/${id}/tasks`, request).then((res) => res.data),

  toggleTask: (id: number, taskId: number) =>
    apiClient.put<OnboardingRecordResponse>(`${BASE}/${id}/tasks/${taskId}/toggle`).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
