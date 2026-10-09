import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { fetchPartOverview } from '../services/partDetails';

export const partDetailKeys = {
  all: (partId: number) => ['part-details', partId] as const,
  overview: (partId: number) => [...partDetailKeys.all(partId), 'overview'] as const,
};

const shared = {
  staleTime: 60_000,
  refetchOnWindowFocus: false,
  // A missing part will not appear on retry.
  retry: (failures: number, error: unknown) => !(axios.isAxiosError(error) && error.response?.status === 404) && failures < 1,
};

export function usePartOverview(partId: number) {
  return useQuery({ queryKey: partDetailKeys.overview(partId), queryFn: () => fetchPartOverview(partId), ...shared });
}
