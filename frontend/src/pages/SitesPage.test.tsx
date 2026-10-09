import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';

import { server } from '../test/server';
import type { Site, SiteListResponse } from '../types/site';
import { SitesPage } from './SitesPage';

function site(overrides: Partial<Site>): Site {
  return {
    id: 1,
    siteId: 1201,
    internalSiteId: 'PEN-01',
    siteName: 'Penang Assembly',
    siteType: 'Final Assembly',
    fullAddress: 'Plot 13, Bayan Lepas, Penang',
    addressLine1: 'Plot 13',
    addressLine2: null,
    addressLine3: null,
    cityLocality: 'Bayan Lepas',
    districtCounty: null,
    stateProvince: 'Penang',
    postalCode: '11900',
    country: 'Malaysia',
    latitude: 5.2945,
    longitude: 100.2593,
    ...overrides,
  };
}

function serve(all: Site[]) {
  server.use(
    http.get('/api/sites', ({ request }) => {
      const params = new URL(request.url).searchParams;
      const page = Number(params.get('page') ?? 0);
      const size = Number(params.get('size') ?? 25);
      const items = all.slice(page * size, page * size + size);
      const body: SiteListResponse = {
        count: items.length,
        objects: items,
        page,
        size,
        totalObjects: all.length,
        totalPages: Math.max(1, Math.ceil(all.length / size)),
        hasMore: (page + 1) * size < all.length,
      };
      return HttpResponse.json(body);
    }),
  );
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SitesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const bodyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);

describe('SitesPage', () => {
  it('shows every site query-config property as a column', async () => {
    serve([site({ id: 1 }), site({ id: 2, siteName: 'Austin HQ', siteType: 'HQ', country: 'United States' })]);

    renderPage();

    expect(await screen.findByText('Penang Assembly')).toBeInTheDocument();
    for (const header of ['Site Name', 'Internal Site ID', 'Site ID', 'Site Type', 'City / Locality',
      'State / Province', 'Country', 'Full Address', 'Address Line 1', 'Address Line 2', 'Address Line 3',
      'District / County', 'Postal Code', 'Latitude', 'Longitude']) {
      expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument();
    }
    expect(screen.queryByRole('columnheader', { name: 'ID' })).not.toBeInTheDocument();
    expect(screen.getByText('Final Assembly')).toBeInTheDocument();
    expect(screen.getByText('HQ')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent('1–2 of 2');
  });

  it('filters the current page by location', async () => {
    serve([site({ id: 1 }), site({ id: 2, siteName: 'Austin HQ', country: 'United States', cityLocality: 'Austin' })]);
    renderPage();
    await screen.findByText('Austin HQ');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search sites' }), 'united states');

    await waitFor(() => expect(bodyRows()).toHaveLength(1));
    expect(screen.getByText('Austin HQ')).toBeInTheDocument();
  });

  it('shows the empty state when the hosted server has no sites', async () => {
    serve([]);

    renderPage();

    expect(await screen.findByText('No sites available.')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent('0–0 of 0');
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });
});
