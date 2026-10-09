import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';

import { server } from '../test/server';
import type { HierarchyItem, HierarchyItemNode, HierarchyNode, HierarchyPageResponse } from '../types/hierarchy';
import { ItemHierarchyPage } from './ItemHierarchyPage';

function item(itemNumber: string, overrides: Partial<HierarchyItem> = {}): HierarchyItem {
  return {
    itemNumber,
    description: `Description of ${itemNumber}`,
    revision: '01',
    itemType: 'NIC',
    itemStatus: 'Production Approved',
    makeBuy: 'MAKE',
    designGroup: 'LAD',
    restricted: false,
    exemptionStatus: 'N/A',
    project: 'Spring Fountain',
    sourceNotes: null,
    collection: null,
    collectionLock: 'Not Locked',
    euRohs: 'Yes',
    euRohsLock: 'Not Locked',
    ecExemptions: null,
    pwbLeadHalogen: 'Yes',
    pwbLeadHalogenLock: 'Not Locked',
    plasticLeadHalogen: 'No Data',
    plasticLeadHalogenLock: 'N/A',
    pnr: 'PNR',
    pnrLock: 'Not Locked',
    businessUnit: 'NPO',
    isProduct: false,
    structureRole: 'ITEM',
    ...overrides,
  };
}

const itemNode = (key: string, number: string, children: HierarchyNode[] = [], qty?: number): HierarchyItemNode => ({
  key,
  id: Number(key.split('/').at(-1)),
  kind: 'ITEM',
  qty,
  item: item(number),
  children,
});

/** 903239 → E70293-013 (qty 1) → [K33608-001 (qty 0.1), part FTLX8574D3BCV-IT]; 903240 shares K33608-001. */
const TREE: HierarchyNode[] = [
  itemNode('1', '903239', [
    itemNode('1/2', 'E70293-013', [
      itemNode('1/2/3', 'K33608-001', [], 0.1),
      { key: '1/2/9', id: 9, kind: 'PART', part: { partNumber: 'FTLX8574D3BCV-IT', manufacturer: 'FINISAR CORPORATION' }, children: [] },
    ], 1),
  ]),
  itemNode('4', '903240', [itemNode('4/3', 'K33608-001', [], 2)]),
];

function serve(roots: HierarchyNode[], totalObjects = roots.length) {
  const requested: string[] = [];
  server.use(
    http.get('/api/item-hierarchy', ({ request }) => {
      const params = new URL(request.url).searchParams;
      const page = Number(params.get('page') ?? 0);
      const size = Number(params.get('size') ?? 25);
      requested.push(`${page}/${size}`);
      const body: HierarchyPageResponse = {
        count: roots.length,
        objects: roots,
        page,
        size,
        totalObjects,
        totalPages: Math.max(1, Math.ceil(totalObjects / size)),
        hasMore: (page + 1) * size < totalObjects,
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
        <ItemHierarchyPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const bodyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);
const rowOf = (text: string) => screen.getByText(text).closest('tr')!;

describe('ItemHierarchyPage', () => {
  it('shows products collapsed with the table-config columns', async () => {
    serve(TREE, 292);

    renderPage();

    expect(await screen.findByText('903239')).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(2);
    expect(screen.queryByText('E70293-013')).not.toBeInTheDocument();
    for (const header of ['Item Number', 'Description', 'Revision', 'Qty', 'Item Type', 'Item Status', 'Make / Buy',
      'Design Group', 'Restricted', 'Exemption Status', 'Project', 'Source Notes', 'EU RoHS', 'PNR Lock',
      'Business Unit', 'Product', 'Structure', 'Part Number', 'Manufacturer']) {
      expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument();
    }
    expect(screen.getByRole('heading', { name: 'Item Hierarchy' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent('1–2 of 292');
  });

  it('expands BOM items with qty and lists sourced parts in the item row', async () => {
    serve(TREE);
    renderPage();
    await screen.findByText('903239');

    await userEvent.click(screen.getByRole('button', { name: 'Expand 903239' }));
    expect(screen.getByRole('button', { name: 'Collapse 903239' })).toHaveAttribute('aria-expanded', 'true');
    expect(within(rowOf('E70293-013')).getByText('1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Expand E70293-013' }));
    expect(within(rowOf('K33608-001')).getByText('0.1')).toBeInTheDocument();
    // The sourced part sits in E70293-013's own row, not in a separate tree row.
    const itemRow = rowOf('E70293-013');
    expect(within(itemRow).getByText('FTLX8574D3BCV-IT')).toBeInTheDocument();
    expect(within(itemRow).getByText('FINISAR CORPORATION')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /FTLX8574D3BCV-IT/ })).not.toBeInTheDocument();
    expect(bodyRows()).toHaveLength(4);

    await userEvent.click(screen.getByRole('button', { name: 'Collapse 903239' }));
    expect(bodyRows()).toHaveLength(2);
  });

  it('links item numbers in the tree to their details page', async () => {
    serve(TREE);
    renderPage();

    expect(await screen.findByRole('link', { name: '903239' })).toHaveAttribute('href', '/items/1');
  });

  it('links part numbers in the tree to their part details page', async () => {
    serve([
      itemNode('1', '903239', [
        { key: '1/9', id: 9, kind: 'PART', part: { partNumber: 'FTLX8574D3BCV-IT', manufacturer: 'FINISAR CORPORATION' }, children: [] },
      ]),
    ]);
    renderPage();

    expect(await screen.findByRole('link', { name: 'FTLX8574D3BCV-IT' })).toHaveAttribute('href', '/parts/9');
  });

  it('shows a shared item under every product that uses it', async () => {
    serve(TREE);
    renderPage();
    await screen.findByText('903239');

    await userEvent.click(screen.getByRole('button', { name: 'Expand all' }));

    expect(screen.getAllByText('K33608-001')).toHaveLength(2);
    expect(bodyRows()).toHaveLength(5);

    await userEvent.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(bodyRows()).toHaveLength(2);
  });

  it('stacks several sourced parts inside one item row', async () => {
    const part = (key: string, partNumber: string, manufacturer: string): HierarchyNode => ({
      key, id: Number(key.split('/').at(-1)), kind: 'PART', part: { partNumber, manufacturer }, children: [],
    });
    serve([itemNode('1', '903239', [
      itemNode('1/5', 'E65689-006', [], 1),
      part('1/7', 'FTLX8574D3BCV-I3', 'FINISAR CORPORATION'),
      part('1/8', 'FTLX8574D3BCV-I5', 'FINISAR CORPORATION'),
      part('1/9', 'FTLX8574D3BCV-IT', 'FINISAR CORPORATION'),
    ])]);
    renderPage();
    await screen.findByText('903239');

    // One item with three parts: three lines, the item cells spanning all of them.
    expect(bodyRows()).toHaveLength(3);
    expect(screen.getByText('903239').closest('td')).toHaveAttribute('rowspan', '3');
    expect(screen.getByText('FTLX8574D3BCV-I3')).toBeInTheDocument();
    expect(screen.getByText('FTLX8574D3BCV-IT')).toBeInTheDocument();
    expect(screen.getAllByText('FINISAR CORPORATION')).toHaveLength(3);
    // Parts are not expandable; only the BOM child item is.
    expect(screen.getByRole('button', { name: 'Expand 903239' })).toBeInTheDocument();
  });

  it('search keeps matching products and opens the path to the match', async () => {
    serve(TREE);
    renderPage();
    await screen.findByText('903239');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search products' }), 'finisar');

    await waitFor(() => expect(screen.getByText('FTLX8574D3BCV-IT')).toBeInTheDocument());
    expect(screen.queryByText('903240')).not.toBeInTheDocument();
  });

  it('has page navigation but no Go to page box', async () => {
    const requested = serve(TREE, 292);
    renderPage();
    await screen.findByText('903239');

    expect(screen.queryByRole('spinbutton', { name: 'Go to page' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Rows' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));

    await waitFor(() => expect(requested.at(-1)).toBe('1/25'));
  });

  it('shows the backend problem detail when loading fails', async () => {
    server.use(
      http.get('/api/item-hierarchy', () =>
        HttpResponse.json({ status: 504, detail: 'The item data source did not respond in time.' }, { status: 504 }),
      ),
    );

    renderPage();

    const alert = await screen.findByRole('alert', {}, { timeout: 4000 });
    expect(alert).toHaveTextContent('Item hierarchy could not be loaded');
    expect(alert).toHaveTextContent('did not respond in time');
  });

  it('shows the empty state when there are no products', async () => {
    serve([]);

    renderPage();

    expect(await screen.findByText('No products available.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand all' })).toBeDisabled();
  });
});
