/** DigiKey contracts of the local API (GET /api/digikey/products/**). Internal names only. */
export interface PriceBreak {
  breakQuantity: number | null;
  unitPrice: number | null;
}

export interface DigiKeyProduct {
  digiKeyPartNumber: string | null;
  manufacturer: string | null;
  manufacturerPartNumber: string | null;
  description: string | null;
  quantityAvailable: number | null;
  unitPrice: number | null;
  currency: string | null;
  datasheetUrl: string | null;
  productUrl: string | null;
  priceBreaks: PriceBreak[];
}

export interface DigiKeySearchResponse {
  products: DigiKeyProduct[];
  totalCount: number | null;
  limit: number;
  offset: number;
}
