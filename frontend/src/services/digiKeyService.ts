import type { DigiKeyProduct, DigiKeySearchResponse } from '../types/digiKey';
import { apiClient } from './apiClient';

/** One page of DigiKey keyword-search results from the local backend (not DigiKey directly). */
export async function searchDigiKeyProducts(
  keyword: string,
  limit: number,
  offset: number,
): Promise<DigiKeySearchResponse> {
  const { data } = await apiClient.get<DigiKeySearchResponse>('/digikey/products/search', {
    params: { keyword, limit, offset },
  });
  return data;
}

/** One DigiKey product by DigiKey (or manufacturer) part number, via the local backend. */
export async function getDigiKeyProduct(productId: string): Promise<DigiKeyProduct> {
  const { data } = await apiClient.get<DigiKeyProduct>(`/digikey/products/${encodeURIComponent(productId)}`);
  return data;
}
