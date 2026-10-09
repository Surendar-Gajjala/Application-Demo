import type { PartOverview } from '../types/partDetails';
import { apiClient } from './apiClient';

export async function fetchPartOverview(partId: number): Promise<PartOverview> {
  const { data } = await apiClient.get<PartOverview>(`/parts/${partId}/overview`);
  return data;
}
