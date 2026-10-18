import { useEffect, useMemo, useState } from 'react';

import { PageHeader } from '../components/PageHeader';
import { DataTable } from '../components/table/DataTable';
import { dash } from '../components/table/cells';
import { LoadError } from '../components/table/LoadError';
import { PaginationFooter } from '../components/table/PaginationFooter';
import { SearchBox } from '../components/table/SearchBox';
import type { Column } from '../components/table/types';
import { usePagination } from '../hooks/usePagination';
import { useDigiKeyProducts } from '../hooks/useDigiKeyProducts';
import type { DigiKeyProduct } from '../types/digiKey';

/** Seeds the search so the table shows basic parts on first load (editable). */
const DEFAULT_KEYWORD = 'resistor';

function externalLink(href: string | null, label: string) {
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
      {label}
    </a>
  ) : (
    dash
  );
}

function price(value: number | null, currency: string | null) {
  if (value === null || value === undefined) return dash;
  return `${currency ? `${currency} ` : ''}${value}`;
}

const COLUMNS: Column<DigiKeyProduct>[] = [
  {
    key: 'digiKeyPartNumber',
    header: 'DigiKey Part #',
    render: (p) => (p.digiKeyPartNumber ? externalLink(p.productUrl, p.digiKeyPartNumber) : dash),
  },
  { key: 'manufacturer', header: 'Manufacturer', render: (p) => p.manufacturer ?? dash },
  { key: 'manufacturerPartNumber', header: 'Mfr Part #', render: (p) => p.manufacturerPartNumber ?? dash },
  { key: 'description', header: 'Description', wide: true, render: (p) => p.description ?? dash },
  {
    key: 'quantityAvailable',
    header: 'In Stock',
    align: 'right',
    render: (p) => (p.quantityAvailable === null ? dash : p.quantityAvailable.toLocaleString()),
  },
  {
    key: 'unitPrice',
    header: 'Unit Price',
    align: 'right',
    render: (p) => {
      const breaks = p.priceBreaks?.length ? `${p.priceBreaks.length} qty breaks` : null;
      return (
        <span className="inline-flex flex-col items-end">
          <span>{price(p.unitPrice, p.currency)}</span>
          {breaks && <span className="text-xs text-gray-500">{breaks}</span>}
        </span>
      );
    },
  },
  { key: 'datasheetUrl', header: 'Datasheet', render: (p) => externalLink(p.datasheetUrl, 'Datasheet') },
  { key: 'productUrl', header: 'Product', render: (p) => externalLink(p.productUrl, 'View') },
];

export function DigiKeySearchPage() {
  const [keyword, setKeyword] = useState(DEFAULT_KEYWORD);
  const { page, pageSize, setPage, setPageSize } = usePagination();

  // A new keyword restarts paging from the first page.
  useEffect(() => {
    setPage(1);
  }, [keyword, setPage]);

  const offset = (page - 1) * pageSize;
  const { data, isLoading, isError, error, isFetching, isPlaceholderData } = useDigiKeyProducts(
    keyword.trim(),
    pageSize,
    offset,
  );
  const rows = useMemo(() => data?.products ?? [], [data]);
  const total = data?.totalCount ?? null;
  const pageCount = total != null ? Math.max(1, Math.ceil(total / pageSize)) : rows.length === pageSize ? page + 1 : page;

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="DigiKey Parts" subtitle="Search electronic parts from DigiKey." />

      <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
        <div className="px-10 py-5">
          <SearchBox
            label="Search DigiKey"
            value={keyword}
            onChange={setKeyword}
            placeholder="Search by keyword, manufacturer part number or DigiKey part number..."
          />
        </div>

        {isError ? (
          <LoadError title="DigiKey parts" error={error} />
        ) : (
          <>
            <div className={`flex min-h-0 flex-1 flex-col transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
              <DataTable
                caption="DigiKey Parts"
                columns={COLUMNS}
                rows={rows}
                getRowKey={(product, index) => product.digiKeyPartNumber ?? `row-${index}`}
                isLoading={isLoading}
                emptyMessage={keyword.trim() ? `No DigiKey parts match "${keyword}".` : 'Enter a search to find DigiKey parts.'}
              />
            </div>
            <PaginationFooter
              noun="parts"
              page={page}
              pageCount={pageCount}
              pageSize={pageSize}
              rangeStart={rows.length > 0 ? offset + 1 : 0}
              rangeEnd={offset + rows.length}
              total={total}
              isLoading={isLoading}
              isFetching={isFetching}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>
    </div>
  );
}
