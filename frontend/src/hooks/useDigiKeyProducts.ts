import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { searchDigiKeyProducts } from '../services/digiKeyService';

/** Independent DigiKey query keys (separate from items/parts/sites). */
export const digiKeyKeys = {
  all: ['digikey'] as const,
  search: (keyword: string, limit: number, offset: number) =>
    [...digiKeyKeys.all, 'search', { keyword, limit, offset }] as const,
};

/** One page of DigiKey search results; disabled until there is a keyword. */
export function useDigiKeyProducts(keyword: string, limit: number, offset: number) {
  return useQuery({
    queryKey: digiKeyKeys.search(keyword, limit, offset),
    queryFn: () => searchDigiKeyProducts(keyword, limit, offset),
    enabled: keyword.trim().length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
