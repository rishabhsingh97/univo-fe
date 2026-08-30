import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { AnnouncementRequest, AnnouncementResponse } from '../../types/engagement';

const BASE = '/api/announcements';

export const announcementApi = {
  list: (page = 0, size = 20) =>
    apiClient.get<PageResponse<AnnouncementResponse>>(BASE, { params: { page, size } }).then((res) => res.data),

  create: (request: AnnouncementRequest) =>
    apiClient.post<AnnouncementResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: AnnouncementRequest) =>
    apiClient.put<AnnouncementResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
