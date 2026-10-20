import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { loadHistory } from '@/actions/crm/AuditActions';
import * as AuditActions from '@/actions/crm/AuditActions';
import { Toaster } from '@/components/ui/sonner';
import type { components } from '@/libs/api/schema';
import messages from '@/locales/en.json';
import { HistoryTimeline } from './HistoryTimeline';

type Event = components['schemas']['AuditEventResponse'];

vi.mock(import('@/actions/crm/AuditActions'), () => ({
  loadHistory: vi.fn<typeof loadHistory>(),
}));

const RILEY = { userId: 2, email: 'riley@acme.test', displayName: 'Riley Rep' };
const WORKSPACE = { id: 7, timezone: 'Asia/Bangkok' };

/**
 * An event on the deal "Acme renewal" (12); the higher the id, the newer.
 * @param id Its id.
 * @param extra What else it says.
 * @returns The event.
 */
const event = (id: number, extra: Partial<Event> = {}): Event => ({
  id,
  occurredAt: new Date(Date.UTC(2026, 9, 18, 12) + id * 60_000).toISOString(),
  actor: RILEY,
  action: 'UPDATE',
  entityType: 'DEAL',
  entityId: 12,
  entityLabel: 'Acme renewal',
  changes: { name: { from: `Name ${id - 1}`, to: `Name ${id}` } },
  ...extra,
});

// Newest first, as the backend sends them: ids from the top down to the bottom.
const newestFirst = (top: number, bottom: number) =>
  Array.from({ length: top - bottom + 1 }, (_, index) => event(top - index));

const history = (first: Event[], total: number) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <HistoryTimeline
      workspace={WORKSPACE}
      entityType="DEAL"
      entityId={12}
      first={first}
      total={total}
    />
  </NextIntlClientProvider>
);

const renderHistory = async (first: Event[], total: number) => await render(history(first, total));

// The names each event renamed the deal to, in the order shown.
const names = () =>
  page
    .getByRole('listitem')
    .elements()
    .flatMap((node) => [...node.querySelectorAll('li')].map((line) => line.textContent));

const showOlder = () => page.getByRole('button', { name: 'Show older' });

/**
 * Answers "Show older" from a server whose history is `server()` (newest first), by page.
 * @param server What the server holds when it is asked.
 */
const serve = (server: () => Event[]) => {
  vi.mocked(AuditActions.loadHistory)
    .mockReset()
    .mockImplementation(
      async (_workspaceId, _type, _id, pageNumber) =>
        await Promise.resolve(server().slice(pageNumber * 10, pageNumber * 10 + 10)),
    );
};
const pagesAsked = () => vi.mocked(AuditActions.loadHistory).mock.calls.map((call) => call[3]);
const renamedTo = () => names().map((line) => Number(line?.split('Name ').at(-1)));
// Ids from the top down to the bottom.
const ids = (top: number, bottom: number) =>
  Array.from({ length: top - bottom + 1 }, (_, index) => top - index);

describe(HistoryTimeline, () => {
  it("shows the record's events newest first, under a heading with their count", async () => {
    await renderHistory(newestFirst(3, 1), 3);

    await expect
      .element(page.getByRole('heading', { name: /History/u }))
      .toHaveTextContent('History3');
    expect(names()).toStrictEqual([
      'Deal name: Name 2 → Name 3',
      'Deal name: Name 1 → Name 2',
      'Deal name: Name 0 → Name 1',
    ]);
    // Everything is in: nothing older to ask for.
    expect(showOlder().elements()).toHaveLength(0);
  });

  it('says so when nothing was recorded', async () => {
    await renderHistory([], 0);

    await expect.element(page.getByText('No changes recorded for this record yet.')).toBeVisible();
  });

  it('adds the next page under "Show older", asking for the page that follows what is shown', async () => {
    vi.mocked(AuditActions.loadHistory).mockResolvedValue(newestFirst(15, 6));
    await renderHistory(newestFirst(25, 16), 25);

    await showOlder().click();

    await expect.element(page.getByText('Deal name: Name 5 → Name 6')).toBeVisible();
    expect(AuditActions.loadHistory).toHaveBeenCalledExactlyOnceWith(7, 'DEAL', 12, 1);
    expect(names()).toHaveLength(20);
    // 5 more still to come.
    await expect.element(showOlder()).toBeVisible();
  });

  it('shows each event once when a page overlaps what is shown, as a new event pushes them down', async () => {
    // Two events landed since the page was read, so page 1 now starts with the last two shown.
    vi.mocked(AuditActions.loadHistory).mockResolvedValue(newestFirst(11, 2));
    await renderHistory(newestFirst(19, 10), 19);

    await showOlder().click();

    await expect.element(page.getByText('Deal name: Name 1 → Name 2')).toBeVisible();
    expect(names()).toHaveLength(18);
    expect(names().filter((line) => line === 'Deal name: Name 10 → Name 11')).toHaveLength(1);
  });

  it('hands the focus to the heading once the last page is in, as the button goes', async () => {
    vi.mocked(AuditActions.loadHistory).mockResolvedValue(newestFirst(5, 1));
    await renderHistory(newestFirst(15, 6), 15);

    await showOlder().click();

    await expect.element(showOlder()).not.toBeInTheDocument();
    await expect.element(page.getByRole('heading', { name: /History/u })).toHaveFocus();
  });

  it('says so in a toast, and keeps the button, when the older ones cannot be loaded', async () => {
    vi.mocked(AuditActions.loadHistory).mockRejectedValue(new Error('offline'));
    // The only test with the toaster: a toast left on screen would cover the next test's button.
    await render(
      <>
        {history(newestFirst(25, 16), 25)}
        <Toaster />
      </>,
    );

    await showOlder().click();

    await expect
      .element(page.getByText("Older history couldn't be loaded. Try again."))
      .toBeVisible();
    await expect.element(showOlder()).toBeVisible();
    expect(names()).toHaveLength(10);
  });

  it('puts an event recorded meanwhile at the top, keeping the older ones already loaded', async () => {
    vi.mocked(AuditActions.loadHistory).mockResolvedValue(newestFirst(15, 6));
    const view = await renderHistory(newestFirst(25, 16), 25);
    await showOlder().click();
    await expect.element(page.getByText('Deal name: Name 5 → Name 6')).toBeVisible();

    // The page refreshed after an edit here: its first page now starts with a new event.
    await view.rerender(history(newestFirst(26, 17), 26));

    expect(names()).toHaveLength(21);
    expect(names()[0]).toBe('Deal name: Name 25 → Name 26');
    await expect
      .element(page.getByRole('heading', { name: /History/u }))
      .toHaveTextContent('History26');
  });

  it('stops asking at the last page there can be, plus one, when none brings anything older', async () => {
    // A server answering every page with what is shown: the loop must end all the same.
    vi.mocked(AuditActions.loadHistory)
      .mockReset()
      .mockImplementation(async () => {
        const tick = Promise.withResolvers<undefined>();
        setTimeout(tick.resolve, 1);
        await tick.promise;
        return newestFirst(25, 16);
      });
    await renderHistory(newestFirst(25, 16), 25);

    await showOlder().click();

    await expect.poll(() => pagesAsked().length).toBe(3);
    // Done asking: the button is free again, and no further page was asked for.
    await expect.element(showOlder()).not.toHaveAttribute('aria-disabled');
    // Pages 1 to 3: page 3 (ceil(25 / 10)) is the last there can be, plus one.
    expect(pagesAsked()).toStrictEqual([1, 2, 3]);
  });

  describe('while teammates record more than a page meanwhile', () => {
    it('goes on to the next page when one holds nothing older than what is shown', async () => {
      // Twelve events landed after the page was read: page 1 now holds only the shown ones and
      // two newer ones, which wait for a refresh.
      serve(() => newestFirst(37, 1));
      await renderHistory(newestFirst(25, 16), 25);

      await showOlder().click();

      // Page 2 holds 17 to 8 now.
      await expect.element(page.getByText('Deal name: Name 7 → Name 8')).toBeVisible();
      expect(pagesAsked()).toStrictEqual([1, 2]);
      expect(renamedTo()).toStrictEqual(ids(25, 8));
      await expect.element(showOlder()).toBeVisible();
    });

    it('leaves no gap when a refreshed first page is all new events, older pages loaded', async () => {
      let server = newestFirst(25, 1);
      serve(() => server);
      const view = await renderHistory(newestFirst(25, 16), 25);
      await showOlder().click();
      await expect.element(page.getByText('Deal name: Name 5 → Name 6')).toBeVisible();

      // Twelve events landed, then an edit here refreshed the page: its first page is all new.
      server = newestFirst(37, 1);
      await view.rerender(history(newestFirst(37, 28), 37));
      await showOlder().click();

      await expect.element(page.getByText('Deal name: Name 17 → Name 18')).toBeVisible();
      // Each event once, none missing between the new page and the older ones.
      expect(renamedTo()).toStrictEqual(ids(37, 18));
      expect(pagesAsked()).toStrictEqual([1, 1]);
    });
  });
});
