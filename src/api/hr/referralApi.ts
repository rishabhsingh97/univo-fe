import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { ReferralRequest, ReferralResponse, ReferralStatusUpdateRequest } from '../../types/hr';

const BASE = '/api/v1/hr/referrals';

export const referralApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<ReferralResponse>>(BASE, { params: { page, size, sort } }).then((res) => res.data),

  create: (request: ReferralRequest) =>
    apiClient.post<ReferralResponse>(BASE, request).then((res) => res.data),

  updateStatus: (id: number, request: ReferralStatusUpdateRequest) =>
    apiClient.put<ReferralResponse>(`${BASE}/${id}/status`, request).then((res) => res.data),
};
