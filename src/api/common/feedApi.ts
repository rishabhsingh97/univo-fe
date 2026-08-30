import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { FeedPostResponse } from '../../types/engagement';

const BASE = '/api/feed';

export const feedApi = {
  list: (page = 0, size = 20) =>
    apiClient.get<PageResponse<FeedPostResponse>>(BASE, { params: { page, size } }).then((res) => res.data),

  create: (content: string, attachment?: File | null) => {
    const form = new FormData();
    form.append('content', content);
    if (attachment) form.append('attachment', attachment);
    return apiClient.post<FeedPostResponse>(BASE, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((res) => res.data);
  },

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),

  // Auth here is an httpOnly cookie (not a bearer token), so the browser attaches it to a plain
  // <img>/<a> request automatically - no need to fetch-and-blob like a token-authenticated
  // download would.
  attachmentUrl: (id: number) => `${apiClient.defaults.baseURL ?? ''}${BASE}/${id}/attachment`,
};
