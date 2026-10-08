import type { PartListResponse } from '../types/part';
import { apiClient } from './apiClient';

/** Fetches one page of parts. `page` is zero-based. */
export async function fetchParts(page: number, size: number): Promise<PartListResponse> {
  const { data } = await apiClient.get<PartListResponse>('/parts', { params: { page, size } });
  return data;
}
