import type { PageResponse } from './page';

/**
 * Part contract of the local API (GET /api/parts). Mirrors the backend PartDto:
 * internal field names only, never the hosted server's external names.
 */
export type SourcingType = 'Off-the-shelf' | 'Custom' | 'Conflict' | 'Unknown';

export type SupplyChainRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'Not Assessed';

export type LifecycleStatus = 'Active' | 'NRND' | 'LastTimeBuy' | 'Obsolete' | 'Unknown';

export interface Part {
  id: number | null;
  partNumber: string | null;
  manufacturer: string | null;
  description: string | null;
  z2PropertiesComparison: string | null;
  countryOfOrigin: string | null;
  sourcingType: SourcingType | null;
  supplyChainRisk: SupplyChainRisk | null;
  lifecycleStatus: LifecycleStatus | null;
}

export type PartListResponse = PageResponse<Part>;
