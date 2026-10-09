import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';

import { server } from '../test/server';
import type { Part, PartListResponse } from '../types/part';
import { PartsPage } from './PartsPage';

function part(overrides: Partial<Part>): Part {
  return {
    id: 1,
    partNumber: 'FC FBMJ3216HS480NT',
    manufacturer: 'TAIYO YUDEN,(USA),INC',
    description: null,
    z2PropertiesComparison: 'incomparable',
    countryOfOrigin: 'China',
    sourcingType: 'Off-the-shelf',
    supplyChainRisk: 'Not Assessed',
    lifecycleStatus: 'Unknown',
    ...overrides,
  };
}

/** Serves `all` the way the backend does: one page per request, with totals. */
function servePaged(all: Part[]) {
  const requested: string[] = [];
  server.use(
    http.get('/api/parts', ({ request }) => {
      const params = new URL(request.url).searchParams;
      const page = Number(params.get('page') ?? 0);
      const size = Number(params.get('size') ?? 25);
      requested.push(`${page}/${size}`);
      const items = all.slice(page * size, page * size + size);
      const body: PartListResponse = {
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
  return requested;
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PartsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const bodyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);

describe('PartsPage', () => {
  it('shows every part query-config property as a column', async () => {
    servePaged([
      part({ id: 1 }),
      part({ id: 2, partNumber: 'P-2', manufacturer: 'Murata', sourcingType: 'Custom', supplyChainRisk: 'MEDIUM', lifecycleStatus: 'Active' }),
    ]);

    renderPage();

    expect(await screen.findByText('FC FBMJ3216HS480NT')).toBeInTheDocument();
    for (const header of ['Part Number', 'Manufacturer', 'Description', 'Sourcing Type', 'Supply Chain Risk',
      'Lifecycle Status', 'Country of Origin', 'Z2 Properties Comparison']) {
      expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument();
    }
    expect(screen.queryByRole('columnheader', { name: 'ID' })).not.toBeInTheDocument();
    expect(screen.getByText('Off-the-shelf')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Parts' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent('1–2 of 2');
  });

  it('filters the current page by manufacturer', async () => {
    servePaged([part({ id: 1 }), part({ id: 2, partNumber: 'P-2', manufacturer: 'Murata' })]);
    renderPage();
    await screen.findByText('P-2');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search parts' }), 'murata');

    await waitFor(() => expect(bodyRows()).toHaveLength(1));
    expect(screen.getByText('P-2')).toBeInTheDocument();
  });

  it('requests the next page from the server', async () => {
    const requested = servePaged(Array.from({ length: 40 }, (_, i) => part({ id: i + 1, partNumber: `PRT-${i + 1}` })));
    renderPage();
    await screen.findByText('PRT-1');

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(await screen.findByText('PRT-26')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent('26–40 of 40');
    expect(requested).toEqual(['0/25', '1/25']);
  });

  it('shows the backend problem detail when loading fails', async () => {
    server.use(
      http.get('/api/parts', () =>
        HttpResponse.json({ status: 504, detail: 'The item data source did not respond in time.' }, { status: 504 }),
      ),
    );

    renderPage();

    const alert = await screen.findByRole('alert', {}, { timeout: 4000 });
    expect(alert).toHaveTextContent('Parts could not be loaded');
  });
});
