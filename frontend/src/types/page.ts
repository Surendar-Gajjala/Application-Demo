/**
 * One page of any entity from the local API (/api/items, /api/parts, ...).
 * `page` is zero-based; totals are null when the source does not report them.
 */
export interface PageResponse<T> {
  count: number;
  objects: T[];
  page: number;
  size: number;
  totalObjects: number | null;
  totalPages: number | null;
  hasMore: boolean;
}

/** RFC 7807 error body returned by the backend. */
export interface ApiProblem {
  status?: number;
  title?: string;
  detail?: string;
  code?: string;
}
