import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { Table, TableBody, TableHeader, TableRow } from '@/components/ui/table';
import type { ActionResult } from '@/libs/api/ApiError';
import type { components } from '@/libs/api/schema';
import type { ListSpec } from '@/libs/crm/ListQuery';
import { ownerGroups, parseListQuery } from '@/libs/crm/ListQuery';
import messages from '@/locales/en.json';
import { SelectAllHead, SelectCell } from './BulkSelect';
import { ownerSections, RecordList } from './RecordList';

// Plain links: the real ones need Next's runtime.
// @ts-expect-error -- only what the list uses
vi.mock(import('@/libs/I18nNavigation'), () => ({
  Link: (props: { href: string; children: React.ReactNode }) => (
    <a href={props.href}>{props.children}</a>
  ),
  useRouter: () => ({ push: vi.fn<(href: string) => void>(), refresh: vi.fn<() => void>() }),
}));
// The bar's actions: these tests send none.
vi.mock(import('@/actions/crm/CompanyActions'), () => ({
  assignCompany: vi.fn<Send>(),
  archiveCompany: vi.fn<Send>(),
  restoreCompany: vi.fn<Send>(),
}));
vi.mock(import('@/actions/crm/ContactActions'), () => ({
  assignContact: vi.fn<Send>(),
  archiveContact: vi.fn<Send>(),
  restoreContact: vi.fn<Send>(),
}));
vi.mock(import('@/actions/crm/DealActions'), () => ({
  assignDeal: vi.fn<Send>(),
  moveDeal: vi.fn<Send>(),
  archiveDeal: vi.fn<Send>(),
  restoreDeal: vi.fn<Send>(),
}));
vi.mock(import('@/actions/crm/LeadActions'), () => ({
  changeLeadStatus: vi.fn<Send>(),
  assignLead: vi.fn<Send>(),
  archiveLead: vi.fn<Send>(),
  restoreLead: vi.fn<Send>(),
}));
vi.mock(import('@/actions/crm/TaskActions'), () => ({
  assignTask: vi.fn<Send>(),
  completeTask: vi.fn<Send>(),
  reopenTask: vi.fn<Send>(),
  cancelTask: vi.fn<Send>(),
}));

type Send = () => Promise<ActionResult>;

const SPEC = {
  sorts: ['NAME', 'UPDATED_AT'],
  defaultSort: 'NAME',
  filters: { ownerId: 'id', industry: 'text' },
  groups: ['owner'],
} as const satisfies ListSpec;
const PATH = '/app/1/companies';
const ME: components['schemas']['MemberResponse'] = {
  userId: 1,
  email: 'olivia@acme.test',
  displayName: 'Olivia Owner',
  role: 'OWNER',
  joinedAt: '2026-01-01T00:00:00Z',
};
const MIA: components['schemas']['MemberResponse'] = {
  ...ME,
  userId: 2,
  email: 'mia@acme.test',
  displayName: 'Mia Manager',
};

const renderList = async (
  params: Record<string, string>,
  pages: { content: string[]; totalElements: number }[],
  bulk = false,
) => {
  const query = parseListQuery(SPEC, params);
  const groups = query.group
    ? ownerSections(ownerGroups(query, [ME, MIA], ME.userId), ME.userId)
    : undefined;
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <RecordList
        id="companies-heading"
        heading={(count) => `${count} companies`}
        path={PATH}
        query={query}
        pages={pages}
        groups={groups}
        members={[ME, MIA]}
        me={ME.userId}
        mayAssign
        empty={{ title: 'No companies yet', text: 'Add one.', archivedText: '', action: null }}
        table={(rows) =>
          bulk ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <SelectAllHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row}>
                    <SelectCell id={row.length} name={row} />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <ul>
              {rows.map((row) => (
                <li key={row}>{row}</li>
              ))}
            </ul>
          )
        }
        bulk={
          bulk
            ? {
                entity: 'company',
                workspaceId: 1,
                // A name's length for its id: the rows' names differ in length.
                item: (row) => ({ id: row.length, name: row, version: 1, mayEdit: true }),
              }
            : undefined
        }
        addRow={(owner) => <p>Add for {owner?.name ?? 'me'}</p>}
      />
    </NextIntlClientProvider>,
  );
};

describe(RecordList, () => {
  it('keeps the caller’s own group, empty, for its add row, and leaves out other empty ones', async () => {
    await renderList({ group: 'owner' }, [
      { content: [], totalElements: 0 },
      { content: ['Acme'], totalElements: 1 },
      { content: [], totalElements: 0 },
    ]);

    await expect
      .element(page.getByRole('button', { name: 'Olivia Owner 0 companies' }))
      .toBeVisible();
    await expect.element(page.getByText('Add for Olivia Owner')).toBeVisible();
    await expect.element(page.getByText('Add for Mia Manager')).toBeVisible();
    await expect.element(page.getByText('Acme')).toBeVisible();
    await expect.element(page.getByRole('button', { name: /Unassigned/u })).not.toBeInTheDocument();
  });

  it('clears the search and filters but keeps the grouping and the sort', async () => {
    await renderList(
      { group: 'owner', industry: 'Retail', q: 'zz', sort: 'UPDATED_AT', direction: 'ASC' },
      [
        { content: [], totalElements: 0 },
        { content: [], totalElements: 0 },
        { content: [], totalElements: 0 },
      ],
    );

    await expect
      .element(page.getByRole('link', { name: 'Clear filters' }))
      .toHaveAttribute('href', `${PATH}?group=owner&sort=UPDATED_AT&direction=ASC`);
  });

  it('gives each section a select-all box named after its heading, and the bar for the list', async () => {
    await renderList({ group: 'owner' }, [
      { content: ['Brightwater'], totalElements: 1 },
      { content: ['Acme', 'Cobalt'], totalElements: 2 },
      { content: [], totalElements: 0 },
    ]);
    await expect.element(page.getByRole('checkbox')).not.toBeInTheDocument();

    document.body.replaceChildren();
    await renderList(
      { group: 'owner' },
      [
        { content: ['Brightwater'], totalElements: 1 },
        { content: ['Acme', 'Cobalt'], totalElements: 2 },
        { content: [], totalElements: 0 },
      ],
      true,
    );

    const mia = page.getByRole('checkbox', { name: 'Select all Mia Manager 2 companies' });
    await mia.click();
    await expect.element(page.getByRole('toolbar')).toHaveAccessibleName('2 selected');
    await expect
      .element(page.getByRole('checkbox', { name: 'Select Cobalt' }))
      .toHaveAttribute('aria-checked', 'true');
    await expect
      .element(page.getByRole('checkbox', { name: 'Select all Olivia Owner 1 companies' }))
      .toHaveAttribute('aria-checked', 'false');
  });
});
