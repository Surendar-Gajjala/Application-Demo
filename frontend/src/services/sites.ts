import axios from 'axios';

// The exact existing payload, reused in place from the backend (no duplicate). Preserves
// the selected properties, output.format "table" and context.tableId "objecttype-view-site".
import siteQuery from '../../../backend/src/main/resources/external-queries/site-query.json';
import type { Site, SiteListResponse } from '../types/site';
import { mapSite } from './siteMapper';

/**
 * Client for the Enterprise Query Config V2 API. In dev the base is a same-origin path
 * (`/enterprise`) that the Vite proxy forwards to the hosted server, injecting the Bearer
 * token server-side — so no token is sent from, or exposed to, the browser here.
 */
const enterpriseClient = axios.create({
  baseURL: import.meta.env.VITE_ENTERPRISE_API_BASE_URL ?? '/enterprise',
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  timeout: 60_000,
});

/** Enterprise response envelope; only `results` and the paging metadata are used. */
interface ExecuteResponse {
  results?: unknown[];
  totalElements?: number | null;
  hasMore?: boolean | null;
}

/**
 * Fetches one page of sites directly from the Enterprise Query Config V2 endpoint
 * (POST, `site-query.json` as the body), and maps `results` to the internal Site model.
 * `page` is zero-based. Does not call the local `/api/sites` endpoint.
 */
export async function fetchSites(page: number, size: number): Promise<SiteListResponse> {
  const { data } = await enterpriseClient.post<ExecuteResponse>('/core/query-config-v2/execute', siteQuery, {
    params: { page, size },
  });

  const rows = Array.isArray(data?.results) ? data.results : [];
  const objects: Site[] = rows
    .filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null && !Array.isArray(row))
    .map(mapSite);

  const totalObjects = typeof data?.totalElements === 'number' ? data.totalElements : null;
  const totalPages = totalObjects === null ? null : Math.max(1, Math.ceil(totalObjects / size));
  const hasMore =
    typeof data?.hasMore === 'boolean'
      ? data.hasMore
      : totalObjects !== null
        ? (page + 1) * size < totalObjects
        : objects.length === size;

  return { count: objects.length, objects, page, size, totalObjects, totalPages, hasMore };
}
