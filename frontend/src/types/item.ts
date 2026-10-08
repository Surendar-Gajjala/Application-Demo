import type { PageResponse } from './page';

/**
 * Item contract of the local API (GET /api/items). Mirrors the backend ItemDto:
 * internal field names only, never the hosted server's external names.
 */
export type StructureRole = 'ITEM' | 'BOM';

export type AvailabilityRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'NOT ASSESSED';

export interface Item {
  id: number | null;
  itemNumber: string | null;
  description: string | null;
  revision: string | null;
  businessUnit: string | null;
  isProduct: boolean | null;
  structureRole: StructureRole | null;
  odmName: string[];
  odmActive: boolean[];
  availabilityRisk: AvailabilityRisk | null;
  usedInProducts: string | null;
  productFamiliesImpacted: number | null;
  itemStatusName: string | null;
}

export type ItemListResponse = PageResponse<Item>;
