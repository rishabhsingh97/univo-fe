import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tableViewApi } from '../api/common/tableViewApi';
import { useAuth } from '../context/AuthContext';
import type { DataTableColumn } from '../components/ui/DataTable';
import type { TableViewPreferenceResponse } from '../types/common';

/**
 * Column show/hide state for one DataTable, keyed by `viewKey` (a stable id the page chooses,
 * e.g. "employees"). Effective visibility is `userColumns ?? defaultColumns ?? every hideable
 * column` - the same fallback chain TableViewPreferenceResponse's own doc comment describes, so
 * a table with nothing configured for it renders exactly as it did before this feature existed.
 */
export function useColumnVisibility<T>(viewKey: string | undefined, columns: DataTableColumn<T>[]) {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canManageDefault = hasPermission('admin.tableview.manage');

  const hideableKeys = columns.filter((c) => c.hideable !== false).map((c) => c.key);
  const alwaysVisibleKeys = columns.filter((c) => c.hideable === false).map((c) => c.key);

  const { data } = useQuery({
    queryKey: ['table-view', viewKey],
    queryFn: () => tableViewApi.get(viewKey as string),
    enabled: Boolean(viewKey),
    staleTime: Infinity,
  });

  const storedVisible = data?.userColumns ?? data?.defaultColumns ?? null;
  // Filters against hideableKeys (not just spreads the stored list) so a column removed from
  // the page's own `columns` array since the preference was saved doesn't linger as a ghost.
  const visibleHideable = storedVisible ? hideableKeys.filter((key) => storedVisible.includes(key)) : hideableKeys;
  const visibleSet = new Set([...alwaysVisibleKeys, ...visibleHideable]);

  const applyResponse = (response: TableViewPreferenceResponse) => {
    queryClient.setQueryData(['table-view', viewKey], response);
  };

  const setMineMutation = useMutation({
    mutationFn: (next: string[]) => tableViewApi.setMine(viewKey as string, next),
    onSuccess: applyResponse,
  });
  const setDefaultMutation = useMutation({
    mutationFn: (next: string[]) => tableViewApi.setDefault(viewKey as string, next),
    onSuccess: applyResponse,
  });
  const resetMutation = useMutation({
    mutationFn: () => tableViewApi.resetMine(viewKey as string),
    onSuccess: applyResponse,
  });

  const toggle = (key: string) => {
    if (!viewKey) return;
    const next = visibleHideable.includes(key)
      ? visibleHideable.filter((k) => k !== key)
      : [...visibleHideable, key];
    if (next.length === 0) return; // always leave at least one hideable column visible
    setMineMutation.mutate(next);
  };

  return {
    isVisible: (key: string) => visibleSet.has(key),
    hideableColumns: columns.filter((c) => c.hideable !== false),
    toggle,
    canManageDefault,
    hasOverride: Boolean(data?.userColumns),
    saveAsDefault: () => setDefaultMutation.mutate(visibleHideable),
    resetToDefault: () => resetMutation.mutate(),
  };
}
