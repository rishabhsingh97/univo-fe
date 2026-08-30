import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type {
  ServiceRequestNoteRequest,
  ServiceRequestRequest,
  ServiceRequestResponse,
  ServiceRequestStatusUpdateRequest,
} from '../../types/services';

const BASE = '/api/v1/hr/services';

export const serviceRequestApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<ServiceRequestResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: ServiceRequestRequest) =>
    apiClient.post<ServiceRequestResponse>(BASE, request).then((res) => res.data),

  updateStatus: (id: number, request: ServiceRequestStatusUpdateRequest) =>
    apiClient.put<ServiceRequestResponse>(`${BASE}/${id}/status`, request).then((res) => res.data),

  addNote: (id: number, request: ServiceRequestNoteRequest) =>
    apiClient.post<ServiceRequestResponse>(`${BASE}/${id}/notes`, request).then((res) => res.data),
};
