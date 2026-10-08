import type { ItemOverview } from '../types/itemDetails';
import type { Part } from '../types/part';
import { apiClient } from './apiClient';

export async function fetchItemOverview(itemId: number): Promise<ItemOverview> {
  const { data } = await apiClient.get<ItemOverview>(`/items/${itemId}/overview`);
  return data;
}

export async function fetchItemSources(itemId: number): Promise<Part[]> {
  const { data } = await apiClient.get<Part[]>(`/items/${itemId}/sources`);
  return data;
}
