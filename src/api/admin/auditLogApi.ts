import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { AuditLogEntryResponse } from '../../types/admin';

export const auditLogApi = {
  list: (page = 0, size = 20, sort?: string) =>
    apiClient
      .get<PageResponse<AuditLogEntryResponse>>('/api/admin/audit-logs', { params: { page, size, sort } })
      .then((res) => res.data),
};
