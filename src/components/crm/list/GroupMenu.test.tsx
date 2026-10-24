import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ListSpec } from '@/libs/crm/ListQuery';
import { parseListQuery } from '@/libs/crm/ListQuery';
import messages from '@/locales/en.json';
import { GroupMenu } from './GroupMenu';
import { MeToggle } from './MeToggle';
import { SortMenu } from './SortMenu';

const router = vi.hoisted(() => ({ push: vi.fn<(href: string) => void>() }));
// @ts-expect-error -- only what the controls use
vi.mock(import('@/libs/I18nNavigation'), () => ({ useRouter: () => router, Link: () => null }));

const SPEC = {
  sorts: ['NAME', 'UPDATED_AT'],
  defaultSort: 'NAME',
  filters: { ownerId: 'id' },
  groups: ['owner'],
} as const satisfies ListSpec;
const PATH = '/app/1/companies';

const renderControls = async (query: Record<string, string>) => {
  router.push.mockClear();
  const listQuery = parseListQuery(SPEC, query);
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <GroupMenu options={[{ group: 'owner', label: 'Owner' }]} path={PATH} query={listQuery} />
      <SortMenu
        options={[
          { sort: 'NAME', label: 'Name' },
          { sort: 'UPDATED_AT', label: 'Updated' },
        ]}
        path={PATH}
        query={listQuery}
      />
      <MeToggle
        me={{ id: 7, email: 'mia@acme.test', role: 'USER', createdAt: '2026-01-01T00:00:00Z' }}
        path={PATH}
        query={listQuery}
      />
    </NextIntlClientProvider>,
  );
};

describe(GroupMenu, () => {
  it('groups by owner, then back to none, which the URL leaves out', async () => {
    await renderControls({ q: 'acme', page: '2' });

    await page.getByRole('button', { name: 'Group' }).click();
    await page.getByRole('menuitemradio', { name: 'Owner' }).click();
    expect(router.push).toHaveBeenLastCalledWith(`${PATH}?q=acme&group=owner`, { scroll: false });
  });

  it('names the grouping it is on', async () => {
    await renderControls({ group: 'owner' });

    await page.getByRole('button', { name: 'Group: Owner' }).click();
    await expect
      .element(page.getByRole('menuitemradio', { name: 'Owner' }))
      .toHaveAttribute('aria-checked', 'true');
    await page.getByRole('menuitemradio', { name: 'None' }).click();
    expect(router.push).toHaveBeenLastCalledWith(PATH, { scroll: false });
  });
});

describe('GroupMenu on a list grouped by default', () => {
  it('writes none for None, and leaves the default grouping out', async () => {
    router.push.mockClear();
    const spec = { ...SPEC, groups: ['status', 'owner'], defaultGroup: 'status' } as const;
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <GroupMenu
          options={[
            { group: 'status', label: 'Status' },
            { group: 'owner', label: 'Owner' },
          ]}
          defaultGroup="status"
          path={PATH}
          query={parseListQuery(spec, { group: 'owner' })}
        />
      </NextIntlClientProvider>,
    );

    await page.getByRole('button', { name: 'Group: Owner' }).click();
    await page.getByRole('menuitemradio', { name: 'None' }).click();
    expect(router.push).toHaveBeenLastCalledWith(`${PATH}?group=none`, { scroll: false });
    await page.getByRole('button', { name: 'Group: Owner' }).click();
    await page.getByRole('menuitemradio', { name: 'Status' }).click();
    expect(router.push).toHaveBeenLastCalledWith(PATH, { scroll: false });
  });
});

describe(SortMenu, () => {
  it('says the sort and its direction, and takes a new sort in its own direction', async () => {
    await renderControls({ sort: 'UPDATED_AT', direction: 'ASC' });

    await page.getByRole('button', { name: 'Sort by Updated Ascending' }).click();
    await page.getByRole('menuitemradio', { name: 'Name' }).click();
    expect(router.push).toHaveBeenLastCalledWith(PATH, { scroll: false });
  });

  it('flips the direction, keeping the sort', async () => {
    await renderControls({ sort: 'UPDATED_AT' });

    await page.getByRole('button', { name: 'Sort by Updated Descending' }).click();
    await page.getByRole('menuitemradio', { name: 'Ascending' }).click();
    expect(router.push).toHaveBeenLastCalledWith(`${PATH}?sort=UPDATED_AT&direction=ASC`, {
      scroll: false,
    });
  });
});

describe(MeToggle, () => {
  it('filters the list to the caller, and back to anyone', async () => {
    await renderControls({});

    const me = page.getByRole('button', { name: 'Me', exact: true });
    await expect.element(me).toHaveAttribute('aria-pressed', 'false');
    await me.click();
    expect(router.push).toHaveBeenLastCalledWith(`${PATH}?ownerId=7`, { scroll: false });
  });

  it('is pressed while the list shows only the caller', async () => {
    await renderControls({ ownerId: '7' });

    const me = page.getByRole('button', { name: 'Me', exact: true });
    await expect.element(me).toHaveAttribute('aria-pressed', 'true');
    await me.click();
    expect(router.push).toHaveBeenLastCalledWith(PATH, { scroll: false });
  });

  it('toggles the assignee on a task list', async () => {
    router.push.mockClear();
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <MeToggle
          me={{ id: 7, email: 'mia@acme.test', role: 'USER', createdAt: '2026-01-01T00:00:00Z' }}
          param="assigneeId"
          path="/app/1/tasks"
          query={parseListQuery(
            { sorts: ['DUE_AT'], defaultSort: 'DUE_AT', filters: { assigneeId: 'id' } },
            { assigneeId: '7' },
          )}
        />
      </NextIntlClientProvider>,
    );

    const me = page.getByRole('button', { name: 'Me', exact: true });
    await expect.element(me).toHaveAttribute('aria-pressed', 'true');
    await me.click();
    expect(router.push).toHaveBeenLastCalledWith('/app/1/tasks', { scroll: false });
  });
});
