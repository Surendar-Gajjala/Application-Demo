import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { server } from '../test/server';
import { DashboardPage } from './DashboardPage';

/** A one-row page carrying only the total, as the list endpoints return for size=1. */
const total = (totalObjects: number) => ({
  count: Math.min(1, totalObjects),
  objects: [],
  page: 0,
  size: 1,
  totalObjects,
  totalPages: Math.max(1, totalObjects),
  hasMore: totalObjects > 1,
});

function serveTotals(items: number, parts: number, sites: number, boms = 292) {
  const sizes: string[] = [];
  server.use(
    http.get('/api/items', ({ request }) => {
      sizes.push(new URL(request.url).searchParams.get('size') ?? '');
      return HttpResponse.json(total(items));
    }),
    http.get('/api/parts', () => HttpResponse.json(total(parts))),
    http.get('/api/sites', () => HttpResponse.json(total(sites))),
    http.get('/api/item-hierarchy/products', () => HttpResponse.json(total(boms))),
    // The tile must never trigger the slow tree endpoint.
    http.get('/api/item-hierarchy', () => HttpResponse.json({ status: 500 }, { status: 500 })),
  );
  return sizes;
}

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/dashboards']}>
        <Routes>
          <Route path="/dashboards" element={<DashboardPage />} />
          <Route path="/items" element={<p>Items tab</p>} />
          <Route path="/parts" element={<p>Parts tab</p>} />
          <Route path="/sites" element={<p>Sites tab</p>} />
          <Route path="/item-hierarchy" element={<p>Item Hierarchy tab</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const tile = (name: RegExp) => screen.getByRole('link', { name });

describe('DashboardPage', () => {
  it('shows the top-level BOM, item, part and site totals', async () => {
    const sizes = serveTotals(5631, 10994, 0);

    renderDashboard();

    expect(await screen.findByTestId('Items-count')).toHaveTextContent('5,631');
    expect(await screen.findByTestId('Parts-count')).toHaveTextContent('11K');
    expect(within(tile(/parts/i)).getByText('10,994 total')).toBeInTheDocument();
    expect(await screen.findByTestId('Sites-count')).toHaveTextContent('0');
    expect(await screen.findByTestId('Top-level BOMs-count')).toHaveTextContent('292');
    expect(sizes).toEqual(['1']);
  });

  it.each([
    [/view items/i, 'Items tab'],
    [/view parts/i, 'Parts tab'],
    [/view sites/i, 'Sites tab'],
    [/view item hierarchy/i, 'Item Hierarchy tab'],
  ])('links %s to its tab', async (name, destination) => {
    serveTotals(1, 1, 1);
    renderDashboard();

    await userEvent.click(tile(name));

    expect(await screen.findByText(destination)).toBeInTheDocument();
  });

  it('marks a tile unavailable when its count fails, without hiding the others', async () => {
    serveTotals(5631, 10994, 0);
    server.use(
      http.get('/api/parts', () =>
        HttpResponse.json({ status: 504, detail: 'The item data source did not respond in time.' }, { status: 504 }),
      ),
    );

    renderDashboard();

    expect(await within(tile(/parts/i)).findByText('Unavailable')).toBeInTheDocument();
    expect(within(tile(/parts/i)).getByText(/did not respond in time/)).toBeInTheDocument();
    expect(await screen.findByTestId('Items-count')).toHaveTextContent('5,631');
  });
});
