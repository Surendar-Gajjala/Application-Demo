import type { Site, SiteType } from '../types/site';

/**
 * Maps one Enterprise Query Config V2 `results` row (keyed by the site-query.json
 * aliases) to the internal {@link Site} model. Mirrors the backend `SiteMapper` /
 * `ExternalValues` normalisation so the frontend and backend agree on field handling:
 * blank/empty/missing become null, numbers are coerced from numeric strings, and
 * site_type is normalised to a {@link SiteType} label. `site__id` is the record id,
 * distinct from `site_id` / `internal_site_id`.
 */
export function mapSite(raw: Record<string, unknown>): Site {
  return {
    id: num(raw.site__id),
    siteId: num(raw.site_id),
    internalSiteId: text(raw.internal_site_id),
    siteName: text(raw.site_name),
    siteType: siteType(raw.site_type),
    fullAddress: text(raw.address_full_address),
    addressLine1: text(raw.address_address_line_1),
    addressLine2: text(raw.address_address_line_2),
    addressLine3: text(raw.address_address_line_3),
    cityLocality: text(raw.address_city_locality),
    districtCounty: text(raw.address_district_county),
    stateProvince: text(raw.address_state_province),
    postalCode: text(raw.address_postal_code),
    country: text(raw.address_country),
    latitude: num(raw.address_latitude),
    longitude: num(raw.address_longitude),
  };
}

/** Trimmed text, or null for null/undefined/blank. */
function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

/** A finite number from a JSON number or numeric string, else null. */
function num(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const s = text(value);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const SITE_TYPES: Record<string, SiteType> = {
  FABRICATION: 'Fabrication',
  FAB: 'Fabrication',
  'IC ASSEMBLY': 'IC Assembly',
  'FINAL ASSEMBLY': 'Final Assembly',
  TEST: 'Test',
  PACKAGING: 'Packaging',
  WAREHOUSE: 'Warehouse',
  HQ: 'HQ',
  HEADQUARTERS: 'HQ',
  OFFICE: 'Office',
};

/** Upper-cases and collapses `_`/`-`/whitespace to single spaces, then maps to a label. */
function siteType(value: unknown): SiteType | null {
  const s = text(value);
  if (s === null) return null;
  const key = s.toUpperCase().replace(/[_\-\s]+/g, ' ').trim();
  return SITE_TYPES[key] ?? null;
}
