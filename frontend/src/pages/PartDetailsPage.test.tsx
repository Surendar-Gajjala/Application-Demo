import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { server } from '../test/server';
import type { PartOverview } from '../types/partDetails';
import { PartDetailsPage } from './PartDetailsPage';

const OVERVIEW: PartOverview = {
  id: 4332025900,
  partNumber: 'Y5363689',
  manufacturer: 'BRADY CORPORATION',
  description: null,
  sections: [
    {
      title: 'General',
      fields: [
        { label: 'Sourcing Type', value: 'Unknown', reason: null },
        { label: 'Country of Origin', value: null, reason: null },
      ],
    },
    {
      title: 'Risk',
      fields: [{ label: 'Availability Risk', value: 'Not Assessed', reason: 'Lifecycle unknown or not matched.' }],
    },
  ],
};

function serve() {
  const calls: string[] = [];
  server.use(
    http.get('/api/parts/:id/overview', ({ params }) => {
      calls.push(`overview:${params.id}`);
      return HttpResponse.json(OVERVIEW);
    }),
  );
  return calls;
}

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/parts/:id" element={<PartDetailsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PartDetailsPage', () => {
  it('shows the overview sections for the part id', async () => {
    const calls = serve();

    renderAt('/parts/4332025900');

    expect(await screen.findByRole('heading', { name: 'Y5363689' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    const general = screen.getByRole('region', { name: 'General' });
    expect(within(general).getByText('Sourcing Type')).toBeInTheDocument();
    expect(within(general).getByText('Unknown')).toBeInTheDocument();
    const risk = screen.getByRole('region', { name: 'Risk' });
    expect(within(risk).getByText('Not Assessed')).toBeInTheDocument();
    expect(within(risk).getByText('Lifecycle unknown or not matched.')).toBeInTheDocument();
    expect(calls).toEqual(['overview:4332025900']);
  });

  it('shows not found for an unknown part', async () => {
    server.use(
      http.get('/api/parts/:id/overview', () =>
        HttpResponse.json({ status: 404, code: 'PART_NOT_FOUND', detail: 'No part exists with this id.' }, { status: 404 }),
      ),
    );

    renderAt('/parts/1');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Part could not be loaded');
    expect(alert).toHaveTextContent('No part exists with this id.');
  });

  it('rejects an invalid part link without calling the API', async () => {
    const calls = serve();

    renderAt('/parts/abc');

    expect(screen.getByText('This part link is not valid.')).toBeInTheDocument();
    expect(calls).toEqual([]);
  });
});
