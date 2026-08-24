import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { NotificationResponse, NotificationUnreadCountResponse } from '../../types/notification';

const BASE = '/api/notifications';

export const notificationApi = {
  list: (page = 0, size = 10) =>
    apiClient.get<PageResponse<NotificationResponse>>(BASE, { params: { page, size } }).then((res) => res.data),

  unreadCount: () => apiClient.get<NotificationUnreadCountResponse>(`${BASE}/unread-count`).then((res) => res.data),

  markRead: (id: number) => apiClient.put<void>(`${BASE}/${id}/read`).then(() => undefined),

  markAllRead: () => apiClient.put<void>(`${BASE}/read-all`).then(() => undefined),
};
