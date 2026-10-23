import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { components } from '@/libs/api/schema';
import type { ListSpec } from '@/libs/crm/ListQuery';
import { ownerGroups, parseListQuery } from '@/libs/crm/ListQuery';
import messages from '@/locales/en.json';
import { RecordList } from './RecordList';

// Plain links: the real ones need Next's runtime.
// @ts-expect-error -- only what the list uses
vi.mock(import('@/libs/I18nNavigation'), () => ({
  Link: (props: { href: string; children: React.ReactNode }) => (
    <a href={props.href}>{props.children}</a>
  ),
  useRouter: () => ({ push: vi.fn<(href: string) => void>() }),
}));

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
) => {
  const query = parseListQuery(SPEC, params);
  const groups = query.group ? ownerGroups(query, [ME, MIA], ME.userId) : undefined;
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
        table={(rows) => (
          <ul>
            {rows.map((row) => (
              <li key={row}>{row}</li>
            ))}
          </ul>
        )}
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
});
