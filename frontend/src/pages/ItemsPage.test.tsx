import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';

import { server } from '../test/server';
import type { Item, ItemListResponse } from '../types/item';
import { ItemsPage } from './ItemsPage';

function item(overrides: Partial<Item>): Item {
  return {
    id: 1,
    itemNumber: 'A-1',
    description: 'Resistor',
    revision: '01',
    businessUnit: null,
    isProduct: false,
    structureRole: 'ITEM',
    odmName: [],
    odmActive: [],
    availabilityRisk: 'NOT ASSESSED',
    usedInProducts: '99DKX3',
    productFamiliesImpacted: 1,
    itemStatusName: 'Production Approved',
    ...overrides,
  };
}

const TWO_ITEMS: Item[] = [
  item({ id: 1, itemNumber: 'A93548-290', description: 'RES D,0402,169.00 kOHM' }),
  item({
    id: 2,
    itemNumber: 'ASSEMBLY-002',
    description: 'Mainboard assembly',
    structureRole: 'BOM',
    odmName: ['Flextronics'],
    odmActive: [true],
    itemStatusName: 'Design',
  }),
];

/** Serves `all` the way the backend does: one page per request, with totals. */
function servePaged(all: Item[]) {
  const requestedPages: string[] = [];
  server.use(
    http.get('/api/items', ({ request }) => {
      const params = new URL(request.url).searchParams;
      const page = Number(params.get('page') ?? 0);
      const size = Number(params.get('size') ?? 25);
      requestedPages.push(`${page}/${size}`);
      const items = all.slice(page * size, page * size + size);
      const body: ItemListResponse = {
        count: items.length,
        items,
        page,
        size,
        totalItems: all.length,
        totalPages: Math.max(1, Math.ceil(all.length / size)),
        hasMore: (page + 1) * size < all.length,
      };
      return HttpResponse.json(body);
    }),
  );
  return requestedPages;
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ItemsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const bodyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);

describe('ItemsPage', () => {
  it('shows every query-config property as a column with the loaded items', async () => {
    servePaged(TWO_ITEMS);

    renderPage();

    expect(await screen.findByText('A93548-290')).toBeInTheDocument();
    for (const header of ['Item Number', 'Description', 'Revision', 'Business Unit', 'Product', 'Structure Role',
      'ODM Name', 'ODM Active', 'Availability Risk', 'Used In Products', 'Families Impacted', 'Item Status']) {
      expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument();
    }
    expect(screen.queryByRole('columnheader', { name: 'ID' })).not.toBeInTheDocument();
    expect(screen.getByText('Flextronics')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /add item/i })).not.toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent('1–2 of 2');
  });

  it('filters the current page by number or description', async () => {
    servePaged(TWO_ITEMS);
    renderPage();
    await screen.findByText('A93548-290');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search items' }), 'mainboard');

    await waitFor(() => expect(bodyRows()).toHaveLength(1));
    expect(screen.getByText('ASSEMBLY-002')).toBeInTheDocument();
  });

  it('requests the next and previous pages from the server', async () => {
    const requested = servePaged(Array.from({ length: 60 }, (_, i) => item({ id: i + 1, itemNumber: `ITM-${i + 1}` })));
    renderPage();
    await screen.findByText('ITM-1');
    const footer = screen.getByRole('contentinfo');
    const previous = screen.getByRole('button', { name: 'Previous page' });
    const next = screen.getByRole('button', { name: 'Next page' });

    expect(footer).toHaveTextContent('1–25 of 60');
    expect(previous).toBeDisabled();

    await userEvent.click(next);
    expect(await screen.findByText('ITM-26')).toBeInTheDocument();
    expect(footer).toHaveTextContent('26–50 of 60');
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');

    await userEvent.click(next);
    expect(await screen.findByText('ITM-51')).toBeInTheDocument();
    expect(footer).toHaveTextContent('51–60 of 60');
    expect(bodyRows()).toHaveLength(10);
    expect(next).toBeDisabled();

    await userEvent.click(previous);
    expect(await screen.findByText('ITM-26')).toBeInTheDocument();
    expect(footer).toHaveTextContent('26–50 of 60');

    expect(requested).toEqual(['0/25', '1/25', '2/25']);
  });

  it('changes rows per page and restarts at page 1', async () => {
    const requested = servePaged(Array.from({ length: 60 }, (_, i) => item({ id: i + 1, itemNumber: `ITM-${i + 1}` })));
    renderPage();
    await screen.findByText('ITM-1');

    await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    await screen.findByText('ITM-26');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Rows' }), '10');

    await waitFor(() => expect(screen.getByRole('contentinfo')).toHaveTextContent('1–10 of 60'));
    expect(screen.getByRole('button', { name: 'Page 6' })).toBeInTheDocument();
    expect(requested.at(-1)).toBe('0/10');
  });

  it('links each item number to its details page', async () => {
    servePaged(TWO_ITEMS);
    renderPage();

    const link = await screen.findByRole('link', { name: 'A93548-290' });

    expect(link).toHaveAttribute('href', '/items/1');
    expect(screen.getByRole('link', { name: 'ASSEMBLY-002' })).toHaveAttribute('href', '/items/2');
  });

  it('jumps to a page with Go to page', async () => {
    const requested = servePaged(Array.from({ length: 200 }, (_, n) => item({ id: n + 1, itemNumber: `ITM-${n + 1}` })));
    renderPage();
    await screen.findByText('ITM-1');

    await userEvent.type(screen.getByRole('spinbutton', { name: 'Go to page' }), '5{Enter}');

    expect(await screen.findByText('ITM-101')).toBeInTheDocument();
    expect(requested.at(-1)).toBe('4/25');
    expect(screen.getByRole('button', { name: 'Page 5' })).toHaveAttribute('aria-current', 'page');

    await userEvent.type(screen.getByRole('spinbutton', { name: 'Go to page' }), '99{Enter}');

    expect(await screen.findByText('ITM-176')).toBeInTheDocument();
    expect(requested.at(-1)).toBe('7/25');
  });

  it('shows the backend problem detail when loading fails', async () => {
    server.use(
      http.get('/api/items', () =>
        HttpResponse.json({ status: 502, detail: 'The item data source rejected the request.' }, { status: 502 }),
      ),
    );

    renderPage();

    // useItems retries once before surfacing the error.
    const alert = await screen.findByRole('alert', {}, { timeout: 4000 });
    expect(alert).toHaveTextContent('The item data source rejected the request.');
  });

  it('shows an empty state when there are no items', async () => {
    servePaged([]);

    renderPage();

    expect(await screen.findByText('No items available.')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent('0–0 of 0');
  });
});
