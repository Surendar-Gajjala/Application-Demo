import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { server } from '../test/server';
import type { ItemOverview } from '../types/itemDetails';
import type { Part } from '../types/part';
import { ItemDetailsPage } from './ItemDetailsPage';

const OVERVIEW: ItemOverview = {
  id: 4332025200,
  itemNumber: 'A93548-290',
  description: 'RES D,0402,169.00 kOHM,1.00%,1/16W,YES',
  revision: '01',
  itemType: 'RESISTOR_DISCRETE',
  itemStatus: 'Conditional',
  sections: [
    {
      title: 'General',
      fields: [
        { label: 'Make / Buy', value: 'BUY', reason: null },
        { label: 'Business Unit', value: null, reason: null },
      ],
    },
    {
      title: 'Risk',
      fields: [{ label: 'Cost Risk', value: 'Not Assessed', reason: 'No active source has both a customer cost.' }],
    },
  ],
};

const SOURCES: Part[] = [
  {
    id: 2,
    partNumber: 'RK73H1ETTP1693F',
    manufacturer: 'KOA SPEER ELECTRONICS',
    description: null,
    z2PropertiesComparison: null,
    countryOfOrigin: null,
    sourcingType: 'Off-the-shelf',
    supplyChainRisk: 'MEDIUM',
    lifecycleStatus: 'Unknown',
  },
];

function serve() {
  const calls: string[] = [];
  server.use(
    http.get('/api/items/:id/overview', ({ params }) => {
      calls.push(`overview:${params.id}`);
      return HttpResponse.json(OVERVIEW);
    }),
    http.get('/api/items/:id/sources', ({ params }) => {
      calls.push(`sources:${params.id}`);
      return HttpResponse.json(SOURCES);
    }),
  );
  return calls;
}

function Location() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname + location.search}</output>;
}

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/items/:id" element={<ItemDetailsPage />} />
        </Routes>
        <Location />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ItemDetailsPage', () => {
  it('shows the overview sections for the item id, without loading Sources', async () => {
    const calls = serve();

    renderAt('/items/4332025200');

    expect(await screen.findByRole('heading', { name: 'A93548-290' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    const general = screen.getByRole('region', { name: 'General' });
    expect(within(general).getByText('Make / Buy')).toBeInTheDocument();
    expect(within(general).getByText('BUY')).toBeInTheDocument();
    const risk = screen.getByRole('region', { name: 'Risk' });
    expect(within(risk).getByText('Not Assessed')).toBeInTheDocument();
    expect(within(risk).getByText('No active source has both a customer cost.')).toBeInTheDocument();
    expect(screen.getByText('Conditional')).toBeInTheDocument();
    expect(calls).toEqual(['overview:4332025200']);
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Overview', 'Sources']);
  });

  it('Sources tab lists the sourced parts with the part columns', async () => {
    const calls = serve();
    renderAt('/items/4332025200');
    await screen.findByRole('heading', { name: 'A93548-290' });

    await userEvent.click(screen.getByRole('tab', { name: 'Sources' }));

    expect(await screen.findByText('RK73H1ETTP1693F')).toBeInTheDocument();
    expect(screen.getByText('KOA SPEER ELECTRONICS')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Sourcing Type' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Sources\s*1/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('location')).toHaveTextContent('/items/4332025200?tab=sources');
    expect(calls).toEqual(['overview:4332025200', 'sources:4332025200']);
  });

  it('shows not found for an unknown item', async () => {
    server.use(
      http.get('/api/items/:id/overview', () =>
        HttpResponse.json({ status: 404, code: 'ITEM_NOT_FOUND', detail: 'No item exists with this id.' }, { status: 404 }),
      ),
    );

    renderAt('/items/1');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Item could not be loaded');
    expect(alert).toHaveTextContent('No item exists with this id.');
  });

  it('falls back to Overview for an old Where Used link', async () => {
    serve();

    renderAt('/items/4332025200?tab=where-used');

    expect(await screen.findByRole('region', { name: 'General' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('tab', { name: /Where Used/ })).not.toBeInTheDocument();
  });

  it('rejects an invalid item link without calling the API', async () => {
    const calls = serve();

    renderAt('/items/abc');

    expect(screen.getByText('This item link is not valid.')).toBeInTheDocument();
    expect(calls).toEqual([]);
  });
});
