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

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  requestId: string | null;
  fieldErrors: { field: string; message: string }[] | null;
}
