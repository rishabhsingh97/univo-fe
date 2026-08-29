/** Mirrors Spring Data's Page<T> JSON shape - every paged list endpoint returns this. */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

/** Either half is null when no row exists yet for that scope - see tableViewApi/DataTable's
 * `viewKey`. Effective visible columns are `userColumns ?? defaultColumns ?? (all columns)`. */
export interface TableViewPreferenceResponse {
  defaultColumns: string[] | null;
  userColumns: string[] | null;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  requestId: string | null;
  fieldErrors: { field: string; message: string }[] | null;
}
