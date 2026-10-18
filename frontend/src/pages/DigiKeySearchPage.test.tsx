import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';

import { server } from '../test/server';
import type { DigiKeyProduct } from '../types/digiKey';
import { DigiKeySearchPage } from './DigiKeySearchPage';

const SEARCH = '/api/digikey/products/search';

function product(overrides: Partial<DigiKeyProduct>): DigiKeyProduct {
  return {
    digiKeyPartNumber: '311-10.0KLRCT-ND',
    manufacturer: 'YAGEO',
    manufacturerPartNumber: 'RC0402FR-0710KL',
    description: 'RES 10K OHM 1% 1/16W 0402',
    quantityAvailable: 500000,
    unitPrice: 0.1,
    currency: 'INR',
    datasheetUrl: 'https://example.com/ds.pdf',
    productUrl: 'https://www.digikey.com/x',
    priceBreaks: [{ breakQuantity: 1, unitPrice: 0.1 }],
    ...overrides,
  };
}

/** Serves the local DigiKey search endpoint and records the keywords requested. */
function serve(byKeyword: (keyword: string) => DigiKeyProduct[]) {
  const keywords: string[] = [];
  server.use(
    http.get(SEARCH, ({ request }) => {
      const params = new URL(request.url).searchParams;
      const keyword = params.get('keyword') ?? '';
      keywords.push(keyword);
      const products = byKeyword(keyword);
      return HttpResponse.json({ products, totalCount: products.length, limit: 25, offset: 0 });
    }),
  );
  return keywords;
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DigiKeySearchPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DigiKeySearchPage', () => {
  it('auto-loads the default keyword and renders product columns with links', async () => {
    const keywords = serve(() => [product({})]);

    renderPage();

    expect(await screen.findByText('YAGEO')).toBeInTheDocument();
    expect(keywords).toContain('resistor');
    for (const header of ['DigiKey Part #', 'Manufacturer', 'Mfr Part #', 'Description', 'In Stock', 'Unit Price',
      'Datasheet', 'Product']) {
      expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument();
    }
    expect(screen.getByText((text) => text.replace(/\D/g, '') === '500000')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Datasheet' })).toHaveAttribute('href', 'https://example.com/ds.pdf');
    expect(screen.getByRole('link', { name: '311-10.0KLRCT-ND' })).toHaveAttribute('href', 'https://www.digikey.com/x');
  });

  it('searches by the typed keyword', async () => {
    serve((keyword) =>
      keyword.includes('capacitor') ? [product({ digiKeyPartNumber: 'CAP-1', description: 'CAP 100nF' })] : [product({})],
    );
    renderPage();
    await screen.findByText('YAGEO');

    const box = screen.getByRole('searchbox', { name: 'Search DigiKey' });
    await userEvent.clear(box);
    await userEvent.type(box, 'capacitor');

    expect(await screen.findByText('CAP 100nF')).toBeInTheDocument();
  });

  it('shows an empty message when there are no matches', async () => {
    serve(() => []);

    renderPage();

    expect(await screen.findByText(/No DigiKey parts match/)).toBeInTheDocument();
  });

  it('shows an error state when the backend fails', async () => {
    server.use(
      http.get(SEARCH, () =>
        HttpResponse.json({ status: 503, detail: 'DigiKey is not configured.' }, { status: 503 }),
      ),
    );

    renderPage();

    const alert = await screen.findByRole('alert', {}, { timeout: 4000 });
    expect(alert).toHaveTextContent('DigiKey parts could not be loaded');
    expect(alert).toHaveTextContent('DigiKey is not configured.');
  });
});
