import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { OfferRequest, OfferResponse } from '../../types/recruitment';

const BASE = '/api/v1/hr/offers';

export const offerApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<OfferResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: OfferRequest) => apiClient.post<OfferResponse>(BASE, request).then((res) => res.data),

  update: (id: number, request: OfferRequest) =>
    apiClient.put<OfferResponse>(`${BASE}/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
