import type { SiteListResponse } from '../types/site';
import { apiClient } from './apiClient';

/** Fetches one page of sites. `page` is zero-based. */
export async function fetchSites(page: number, size: number): Promise<SiteListResponse> {
  const { data } = await apiClient.get<SiteListResponse>('/sites', { params: { page, size } });
  return data;
}
