import type { ItemListResponse } from '../types/item';
import { apiClient } from './apiClient';

/** Fetches one page of items. `page` is zero-based. */
export async function fetchItems(page: number, size: number): Promise<ItemListResponse> {
  const { data } = await apiClient.get<ItemListResponse>('/items', { params: { page, size } });
  return data;
}
