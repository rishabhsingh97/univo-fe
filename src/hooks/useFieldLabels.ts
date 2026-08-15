import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fieldConfigApi } from '../api/admin/fieldConfigApi';
import type { UiFieldConfigResponse } from '../types/admin';

/**
 * Resolves per-tenant label/visibility/read-only overrides configured on Settings > Fields &
 * Labels (UiFieldConfig, /api/field-config) for a given entity's hardcoded form fields. Falls
 * back to the caller's default for any field with no override, or while config hasn't loaded
 * yet - so a tenant with nothing configured renders identically to before this hook existed.
 *
 * Deliberately a distinct query key from FieldConfigPage's admin listByEntity query - same
 * shape of data, but a different endpoint/permission, so they must not share a cache entry.
 */
export function useFieldLabels(entityName: string) {
  const { data } = useQuery({
    queryKey: ['field-config-readonly', entityName],
    queryFn: () => fieldConfigApi.listForEntity(entityName),
    staleTime: 5 * 60 * 1000,
  });

  const overrides = useMemo(() => {
    const map = new Map<string, UiFieldConfigResponse>();
    (data ?? []).forEach((config) => map.set(config.fieldName, config));
    return map;
  }, [data]);

  return useMemo(
    () => ({
      label: (fieldName: string, fallback: string) => overrides.get(fieldName)?.label || fallback,
      isHidden: (fieldName: string) => overrides.get(fieldName)?.enabled === false,
      isReadOnly: (fieldName: string) => overrides.get(fieldName)?.readOnly === true,
      isRequired: (fieldName: string, fallback: boolean) => overrides.get(fieldName)?.required ?? fallback,
    }),
    [overrides],
  );
}
