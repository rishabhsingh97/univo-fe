import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { TaskRequest, TaskResponse, TaskStatusUpdateRequest, TaskSubtaskRequest } from '../../types/tasks';

const BASE = '/api/v1/hr/tasks';

export const taskApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<TaskResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: TaskRequest) => apiClient.post<TaskResponse>(BASE, request).then((res) => res.data),

  updateStatus: (id: number, request: TaskStatusUpdateRequest) =>
    apiClient.put<TaskResponse>(`${BASE}/${id}/status`, request).then((res) => res.data),

  addSubtask: (id: number, request: TaskSubtaskRequest) =>
    apiClient.post<TaskResponse>(`${BASE}/${id}/subtasks`, request).then((res) => res.data),

  toggleSubtask: (id: number, subtaskId: number) =>
    apiClient.put<TaskResponse>(`${BASE}/${id}/subtasks/${subtaskId}/toggle`).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
