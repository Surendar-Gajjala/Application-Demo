import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { fetchHierarchyProducts, fetchItemHierarchy } from '../services/hierarchy';

export const hierarchyKeys = {
  all: ['item-hierarchy'] as const,
  list: (page: number, size: number) => [...hierarchyKeys.all, 'list', { page, size }] as const,
  products: (page: number, size: number) => [...hierarchyKeys.all, 'products', { page, size }] as const,
};

/**
 * One page of top-level products with their whole BOM and sourced-part trees; `page`
 * is zero-based. Expanding rows needs no further requests.
 */
export function useItemHierarchy(page: number, size: number) {
  return useQuery({
    queryKey: hierarchyKeys.list(page, size),
    queryFn: () => fetchItemHierarchy(page, size),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/** Top-level product item numbers only (one anchors query, no graph traversal); `page` is zero-based. */
export function useHierarchyProducts(page: number, size: number) {
  return useQuery({
    queryKey: hierarchyKeys.products(page, size),
    queryFn: () => fetchHierarchyProducts(page, size),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
