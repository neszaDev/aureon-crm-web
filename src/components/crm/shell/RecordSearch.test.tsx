import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { SearchGroups } from '@/actions/crm/SearchActions';
import { searchAll } from '@/actions/crm/SearchActions';
import * as Navigation from '@/libs/I18nNavigation';
import messages from '@/locales/en.json';
import { RecordSearch } from './RecordSearch';

vi.mock(import('@/actions/crm/SearchActions'), () => ({ searchAll: vi.fn<typeof searchAll>() }));
vi.mock(import('@/libs/I18nNavigation'), async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn<typeof Navigation.useRouter>(),
}));

const NONE: SearchGroups = { companies: [], contacts: [], leads: [], deals: [] };
const ACME: SearchGroups = {
  companies: [
    {
      id: 7,
      label: 'Acme Trading',
      detail: 'https://acme.test',
      href: '/app/1/companies/7',
      reference: 'C-0007',
    },
    { id: 9, label: 'Acme Logistics', href: '/app/1/companies/9', reference: 'C-0009' },
  ],
  contacts: [],
  leads: [
    { id: 5, label: 'Noa Park', detail: 'Acme', href: '/app/1/leads/5', reference: 'L-0005' },
  ],
  deals: [{ id: 8, label: 'Acme renewal', href: '/app/1/deals/8', reference: 'D-0008' }],
};

const push = vi.fn<(href: string) => void>();

const renderSearch = async () => {
  vi.mocked(searchAll).mockReset();
  push.mockReset();
  // @ts-expect-error -- only what the search uses
  vi.mocked(Navigation.useRouter).mockReturnValue({ push });
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <button type="button">Notes</button>
      <RecordSearch workspaceId={1} />
    </NextIntlClientProvider>,
  );
};

const trigger = () => page.getByRole('button', { name: 'Search records' });
const field = () => page.getByRole('combobox', { name: 'Search records' });
const open = async () => {
  await trigger().click();
  await expect.element(field()).toBeVisible();
};

const pause = async (ms: number) => {
  const { promise, resolve } = Promise.withResolvers<undefined>();
  setTimeout(resolve, ms);
  await promise;
};

// Ctrl with the physical K key, which the layout names `key`.
const press = (key: string) =>
  document.dispatchEvent(
    new KeyboardEvent('keydown', { key, code: 'KeyK', ctrlKey: true, bubbles: true }),
  );

describe(RecordSearch, () => {
  it('opens from its button, which shows the shortcut, and from Ctrl+K and Cmd+K', async () => {
    await renderSearch();

    await expect.element(trigger()).toHaveAttribute('aria-keyshortcuts', 'Control+K Meta+K');
    await expect.element(trigger()).toHaveTextContent(/⌘K|Ctrl K/u);
    await open();
    await userEvent.keyboard('{Escape}');
    await expect.element(field()).not.toBeInTheDocument();

    await userEvent.keyboard('{Control>}k{/Control}');
    await expect.element(field()).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect.element(field()).not.toBeInTheDocument();
    await userEvent.keyboard('{Meta>}k{/Meta}');
    await expect.element(field()).toBeVisible();
  });

  it('opens on the K key of any layout: a Thai one reports a Thai character, not "k"', async () => {
    await renderSearch();
    // Dvorak's Ctrl+T sits on the same key: a Latin letter that is not k is that layout's own.
    press('t');
    await pause(150);
    expect(field().elements()).toHaveLength(0);

    press('ะ');
    await expect.element(field()).toBeVisible();
  });

  it('gives the focus back to where it was when opened with the shortcut, and to its button otherwise', async () => {
    await renderSearch();
    const notes = page.getByRole('button', { name: 'Notes' });
    notes.element().focus();

    await userEvent.keyboard('{Control>}k{/Control}');
    await expect.element(field()).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect.element(field()).not.toBeInTheDocument();
    await expect.element(notes).toHaveFocus();

    await open();
    await userEvent.keyboard('{Escape}');
    await expect.element(field()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveFocus();
  });

  it('asks nobody for fewer than 2 characters, and says how many it needs', async () => {
    await renderSearch();
    await open();

    await userEvent.keyboard('a');
    await pause(500);

    expect(searchAll).not.toHaveBeenCalled();
    await expect.element(page.getByText('Type at least 2 characters.')).toBeVisible();

    // Spaces don't count.
    await userEvent.keyboard('  ');
    await pause(400);
    expect(searchAll).not.toHaveBeenCalled();
  });

  it('searches once the typing pauses, and shows the groups with their record numbers', async () => {
    await renderSearch();
    vi.mocked(searchAll).mockResolvedValue(ACME);
    await open();

    await userEvent.keyboard('acme');

    await expect.element(page.getByRole('group', { name: 'Companies' })).toBeVisible();
    await expect.element(page.getByRole('group', { name: 'Leads' })).toBeVisible();
    await expect.element(page.getByRole('group', { name: 'Deals' })).toBeVisible();
    expect(page.getByRole('group', { name: 'Contacts' }).elements()).toHaveLength(0);
    await expect.element(page.getByRole('option', { name: /C-0007.*Acme Trading/u })).toBeVisible();
    await expect.element(page.getByText('https://acme.test')).toBeVisible();
    await expect.element(page.getByRole('option', { name: /D-0008.*Acme renewal/u })).toBeVisible();
    // Four keys, one search.
    expect(searchAll).toHaveBeenCalledExactlyOnceWith(1, 'acme');
  });

  it('opens the highlighted record on Enter, and the one arrowed to', async () => {
    await renderSearch();
    vi.mocked(searchAll).mockResolvedValue(ACME);
    await open();
    await userEvent.keyboard('acme');
    await expect.element(page.getByRole('option', { name: /C-0007/u })).toBeVisible();

    await userEvent.keyboard('{Enter}');

    expect(push).toHaveBeenCalledExactlyOnceWith('/app/1/companies/7');
    await expect.element(field()).not.toBeInTheDocument();

    await open();
    await userEvent.keyboard('acme');
    await expect.element(page.getByRole('option', { name: /D-0008/u })).toBeVisible();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(push).toHaveBeenLastCalledWith('/app/1/leads/5');
  });

  it('opens a record on click', async () => {
    await renderSearch();
    vi.mocked(searchAll).mockResolvedValue(ACME);
    await open();
    await userEvent.keyboard('acme');

    await page.getByRole('option', { name: /D-0008/u }).click();

    expect(push).toHaveBeenCalledExactlyOnceWith('/app/1/deals/8');
  });

  it('says so when no record matches', async () => {
    await renderSearch();
    vi.mocked(searchAll).mockResolvedValue(NONE);
    await open();

    await userEvent.keyboard('zzz');

    await expect.element(page.getByText('No records match')).toBeVisible();
  });

  it('says so, and tries again on the next key, when the search fails', async () => {
    await renderSearch();
    vi.mocked(searchAll).mockRejectedValueOnce(new Error('503')).mockResolvedValue(ACME);
    await open();

    await userEvent.keyboard('acme');
    await expect.element(page.getByText("Couldn't search. Try again.")).toBeVisible();

    await userEvent.keyboard('x');
    await expect.element(page.getByRole('option', { name: /C-0007/u })).toBeVisible();
    await expect.element(page.getByText("Couldn't search. Try again.")).not.toBeInTheDocument();
  });

  it('says it is searching until the answer comes', async () => {
    await renderSearch();
    const answer = Promise.withResolvers<SearchGroups>();
    vi.mocked(searchAll).mockReturnValue(answer.promise);
    await open();

    await userEvent.keyboard('acme');

    await expect.element(page.getByText('Searching…')).toBeVisible();
    answer.resolve(ACME);
    await expect.element(page.getByRole('option', { name: /C-0007/u })).toBeVisible();
  });

  it("keeps the latest search's results when an earlier one answers last", async () => {
    await renderSearch();
    const slow = Promise.withResolvers<SearchGroups>();
    vi.mocked(searchAll)
      .mockReturnValueOnce(slow.promise)
      .mockResolvedValueOnce({ ...NONE, deals: ACME.deals });
    await open();
    await userEvent.keyboard('ac');
    await pause(400);

    await userEvent.keyboard('m');
    await expect.element(page.getByRole('option', { name: /D-0008/u })).toBeVisible();
    slow.resolve(ACME);
    await pause(100);

    expect(page.getByRole('option', { name: /C-0007/u }).elements()).toHaveLength(0);
    await expect.element(page.getByRole('option', { name: /D-0008/u })).toBeVisible();
  });

  it('does not open a record the text no longer matches: Enter while a new search is on its way does nothing', async () => {
    await renderSearch();
    const next = Promise.withResolvers<SearchGroups>();
    vi.mocked(searchAll).mockResolvedValueOnce(ACME).mockReturnValueOnce(next.promise);
    await open();
    await userEvent.keyboard('acme');
    await expect.element(page.getByRole('option', { name: /C-0007/u })).toBeVisible();

    await userEvent.keyboard('x{Enter}');
    await pause(400);

    expect(push).not.toHaveBeenCalled();
    next.resolve(NONE);
  });

  it('starts empty each time it opens', async () => {
    await renderSearch();
    vi.mocked(searchAll).mockResolvedValue(ACME);
    await open();
    await userEvent.keyboard('acme');
    await expect.element(page.getByRole('option', { name: /C-0007/u })).toBeVisible();
    await userEvent.keyboard('{Escape}');

    await open();

    await expect.element(field()).toHaveValue('');
    expect(page.getByRole('option').elements()).toHaveLength(0);
  });
});
