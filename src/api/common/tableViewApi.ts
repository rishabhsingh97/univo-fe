import { apiClient } from '../client';
import type { TableViewPreferenceResponse } from '../../types/common';

/** Backs DataTable's `viewKey` column-visibility picker - see TableViewPreferenceController. */
export const tableViewApi = {
  get: (tableKey: string) =>
    apiClient.get<TableViewPreferenceResponse>(`/api/table-views/${tableKey}`).then((res) => res.data),

  /** Admin-gated on the backend (admin.tableview.manage) - sets the tenant-wide default. */
  setDefault: (tableKey: string, visibleColumns: string[]) =>
    apiClient
      .put<TableViewPreferenceResponse>(`/api/table-views/${tableKey}/default`, { visibleColumns })
      .then((res) => res.data),

  /** Any authenticated user - sets their own override on top of the default. */
  setMine: (tableKey: string, visibleColumns: string[]) =>
    apiClient
      .put<TableViewPreferenceResponse>(`/api/table-views/${tableKey}/mine`, { visibleColumns })
      .then((res) => res.data),

  resetMine: (tableKey: string) =>
    apiClient.delete<TableViewPreferenceResponse>(`/api/table-views/${tableKey}/mine`).then((res) => res.data),
};
