import type { HierarchyPageResponse } from '../types/hierarchy';
import type { PageResponse } from '../types/page';
import { apiClient } from './apiClient';

/** Fetches one page of top-level products with their full trees. `page` is zero-based. */
export async function fetchItemHierarchy(page: number, size: number): Promise<HierarchyPageResponse> {
  const { data } = await apiClient.get<HierarchyPageResponse>('/item-hierarchy', { params: { page, size } });
  return data;
}

/** One page of top-level product item numbers only (no trees). `page` is zero-based. */
export async function fetchHierarchyProducts(page: number, size: number): Promise<PageResponse<string>> {
  const { data } = await apiClient.get<PageResponse<string>>('/item-hierarchy/products', { params: { page, size } });
  return data;
}
