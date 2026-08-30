import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { ConversationResponse, MessageResponse, SendMessageRequest, StartConversationRequest } from '../../types/messaging';

const BASE = '/api/conversations';

export const conversationApi = {
  // Not paged - GET /api/conversations returns every conversation for the caller as a plain array.
  list: () => apiClient.get<ConversationResponse[]>(BASE).then((res) => res.data),

  startOrGet: (request: StartConversationRequest) =>
    apiClient.post<ConversationResponse>(BASE, request).then((res) => res.data),

  listMessages: (conversationId: number, page = 0, size = 30) =>
    apiClient
      .get<PageResponse<MessageResponse>>(`${BASE}/${conversationId}/messages`, { params: { page, size } })
      .then((res) => res.data),

  sendMessage: (conversationId: number, request: SendMessageRequest) =>
    apiClient.post<MessageResponse>(`${BASE}/${conversationId}/messages`, request).then((res) => res.data),

  markRead: (conversationId: number) => apiClient.put<void>(`${BASE}/${conversationId}/read`).then(() => undefined),
};
