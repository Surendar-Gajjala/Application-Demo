import type { OverviewSection } from './itemDetails';

/**
 * Part details contract of the local API (GET /api/parts/{id}/overview). Reuses the
 * shared overview section/field shape (see ./itemDetails.ts).
 */
export interface PartOverview {
  id: number;
  partNumber: string | null;
  manufacturer: string | null;
  description: string | null;
  sections: OverviewSection[];
}
