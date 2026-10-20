import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type {
  deleteActivity,
  loadActivities,
  logActivity,
  updateActivity,
} from '@/actions/crm/ActivityActions';
import * as ActivityActions from '@/actions/crm/ActivityActions';
import type { components } from '@/libs/api/schema';
import messages from '@/locales/en.json';
import { ActivityTimeline } from './ActivityTimeline';

type Activity = components['schemas']['ActivityResponse'];

vi.mock(import('@/actions/crm/ActivityActions'), () => ({
  loadActivities: vi.fn<typeof loadActivities>(),
  logActivity: vi.fn<typeof logActivity>(),
  updateActivity: vi.fn<typeof updateActivity>(),
  deleteActivity: vi.fn<typeof deleteActivity>(),
}));

const MIA = { userId: 1, email: 'mia@acme.test', displayName: 'Mia Manager' };
const RILEY = { userId: 2, email: 'riley@acme.test', displayName: 'Riley Rep' };

/**
 * An activity on the company Acme (7).
 * @param id Its id.
 * @param subject Its subject.
 * @param author Who logged it.
 * @returns The activity.
 */
const activity = (id: number, subject: string, author = MIA): Activity => ({
  id,
  type: 'CALL',
  subject,
  // An hour older for each id: newest first is by id.
  occurredAt: new Date(Date.UTC(2026, 9, 18, 12) - id * 3_600_000).toISOString(),
  author,
  company: { id: 7, name: 'Acme' },
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  version: 0,
});

const timeline = (first: Activity[], total: number, canEditAny = false) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <ActivityTimeline
      workspaceId={1}
      link={{ companyId: 7 }}
      first={first}
      total={total}
      me={MIA.userId}
      permissions={canEditAny ? ['RECORDS_EDIT_ANY'] : []}
      timeZone="Asia/Bangkok"
      now="2026-10-18T03:00:00Z"
    />
  </NextIntlClientProvider>
);

const renderTimeline = async (first: Activity[], total: number, canEditAny = false) =>
  await render(timeline(first, total, canEditAny));

const subjects = () =>
  page
    .getByRole('listitem')
    .elements()
    .map((node) => node.querySelector('h3')?.textContent);

// The first page of 20, newest first: A1 to A20.
const FIRST_PAGE = Array.from({ length: 20 }, (_, index) => activity(index + 1, `A${index + 1}`));

const item = (subject: string) => page.getByRole('listitem').filter({ hasText: subject });

const logButton = () => page.getByRole('button', { name: 'Log activity' });
const subject = () => page.getByLabelText('Subject');

/**
 * Activities by id, newest first: the lower the id, the newer (ids under 1 came later).
 * @param from The newest id.
 * @param to The oldest id.
 * @returns The activities, each named A and its id.
 */
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => activity(from + index, `A${from + index}`));

/**
 * Answers "Show older" from a server whose activities are `server()` (newest first): a page of
 * those before `to`, as the API's exclusive `to` filters them.
 * @param server What the server holds when it is asked.
 */
const serve = (server: () => Activity[]) => {
  vi.mocked(ActivityActions.loadActivities)
    .mockReset()
    .mockImplementation(
      async (_workspaceId, _link, older) =>
        await Promise.resolve(
          server()
            .filter(
              (each) =>
                older.to === undefined || Date.parse(each.occurredAt) < Date.parse(older.to),
            )
            .slice(older.page * 20, older.page * 20 + 20),
        ),
    );
};
const asked = () => vi.mocked(ActivityActions.loadActivities).mock.calls.map((call) => call[2]);

/**
 * The instant 1 ms after an activity's: the exclusive `to` that still takes it and its ties.
 * @param one The activity.
 * @returns The instant.
 */
const justAfter = (one: Activity) => new Date(Date.parse(one.occurredAt) + 1).toISOString();

describe(ActivityTimeline, () => {
  it('keeps the composer behind a "Log activity" button, which opens it on the Subject', async () => {
    await renderTimeline([activity(1, 'Mia called')], 1);

    expect(subject().elements()).toHaveLength(0);
    await logButton().click();

    await expect.element(subject()).toBeVisible();
    await expect.element(subject()).toHaveFocus();
    // The button that opened it is gone: the submit has its name now.
    expect(page.getByRole('button', { name: 'Log activity' }).elements()).toHaveLength(1);
  });

  it('closes the composer on Escape and on Cancel, handing the focus back to the button', async () => {
    await renderTimeline([activity(1, 'Mia called')], 1);
    await logButton().click();
    await subject().fill('half typed');

    await userEvent.keyboard('{Escape}');

    await expect.element(subject()).not.toBeInTheDocument();
    await expect.element(logButton()).toHaveFocus();

    await logButton().click();
    // Typed again from nothing: the closed one kept nothing.
    await expect.element(subject()).toHaveValue('');
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect.element(subject()).not.toBeInTheDocument();
    await expect.element(logButton()).toHaveFocus();
  });

  it('closes the composer once the activity is logged, and opens ready for the next', async () => {
    vi.mocked(ActivityActions.logActivity).mockResolvedValue({ ok: true });
    await renderTimeline([activity(1, 'Mia called')], 1);
    await logButton().click();
    await subject().fill('Intro call');
    await page.getByRole('button', { name: 'Log activity' }).click();

    await expect.element(subject()).not.toBeInTheDocument();
    expect(ActivityActions.logActivity).toHaveBeenCalledExactlyOnceWith(
      1,
      expect.objectContaining({ subject: 'Intro call', companyId: 7 }),
    );
    await logButton().click();
    await expect.element(subject()).toHaveValue('');
  });

  it("offers edit and delete only on the caller's own activities without RECORDS_EDIT_ANY", async () => {
    await renderTimeline([activity(1, 'Riley called', RILEY), activity(2, 'Mia called')], 2);

    await expect.element(item('Riley called')).toBeVisible();
    expect(item('Riley called').getByRole('button').elements()).toHaveLength(0);
    await expect
      .element(item('Mia called').getByRole('button', { name: 'Edit Mia called' }))
      .toBeVisible();
    await expect
      .element(item('Mia called').getByRole('button', { name: 'Delete Mia called' }))
      .toBeVisible();
  });

  it("offers them on everyone's activities with RECORDS_EDIT_ANY", async () => {
    await renderTimeline([activity(1, 'Riley called', RILEY)], 1, true);

    await expect
      .element(item('Riley called').getByRole('button', { name: 'Edit Riley called' }))
      .toBeVisible();
  });

  it('appends the next page on "Show older", once each, and moves the focus to it', async () => {
    vi.mocked(ActivityActions.loadActivities).mockResolvedValue([
      // Logged meanwhile: the page boundary moved, so the last one shown comes again.
      activity(20, 'A20'),
      activity(21, 'A21'),
      activity(22, 'A22'),
    ]);
    await renderTimeline(FIRST_PAGE, 22);

    await page.getByRole('button', { name: 'Show older' }).click();

    await expect.element(item('A22')).toBeVisible();
    // Those before the last one shown, by time.
    expect(ActivityActions.loadActivities).toHaveBeenCalledWith(
      1,
      { companyId: 7 },
      { page: 0, to: justAfter(activity(20, 'A20')) },
    );
    expect(subjects()).toStrictEqual(Array.from({ length: 22 }, (_, index) => `A${index + 1}`));
    await expect.element(page.getByRole('heading', { name: 'A21', exact: true })).toHaveFocus();
    await expect.element(page.getByRole('button', { name: 'Show older' })).not.toBeInTheDocument();
  });

  it('keeps the activity a refreshed first page pushed onto the next one, once older ones show', async () => {
    vi.mocked(ActivityActions.loadActivities).mockResolvedValue([
      activity(21, 'A21'),
      activity(22, 'A22'),
    ]);
    const screen = await renderTimeline(FIRST_PAGE, 22);
    await page.getByRole('button', { name: 'Show older' }).click();
    await expect.element(item('A22')).toBeVisible();

    // Logged: the server's first page is now A0 to A19; A20 moved to the second page.
    await screen.rerender(timeline([activity(0, 'A0'), ...FIRST_PAGE.slice(0, 19)], 23));

    await expect.element(item('A0')).toBeVisible();
    expect(subjects()).toStrictEqual(Array.from({ length: 23 }, (_, index) => `A${index}`));
    await expect.element(page.getByRole('button', { name: 'Show older' })).not.toBeInTheDocument();
  });

  it('shows an activity edited here as saved, not the copy an earlier first page held', async () => {
    vi.mocked(ActivityActions.loadActivities).mockResolvedValue([
      activity(21, 'A21'),
      activity(22, 'A22'),
    ]);
    // "When" moved back past A22: it leaves the first page.
    vi.mocked(ActivityActions.updateActivity).mockResolvedValue({
      ok: true,
      activity: { ...activity(30, 'A5 moved'), id: 5, version: 1 },
    });
    const screen = await renderTimeline(FIRST_PAGE, 22);
    await page.getByRole('button', { name: 'Show older' }).click();
    await expect.element(item('A22')).toBeVisible();

    await page.getByRole('button', { name: 'Edit A5' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    // The refresh after the save: A5 left the first page, A21 joined it.
    await screen.rerender(
      timeline([...FIRST_PAGE.filter((each) => each.id !== 5), activity(21, 'A21')], 22),
    );

    await expect.element(item('A5 moved')).toBeVisible();
    expect(subjects()).toStrictEqual([
      ...FIRST_PAGE.filter((each) => each.id !== 5).map((each) => each.subject),
      'A21',
      'A22',
      'A5 moved',
    ]);
  });

  it('shows an activity moved here past the pages shown once, last, skipping none', async () => {
    // 45 activities, A1 to A45. A5 is edited to the oldest time of all.
    const all = range(1, 45);
    const moved = { ...activity(60, 'A5 moved'), id: 5, version: 1 };
    const after = [...all.filter((each) => each.id !== 5), moved];
    let server = all;
    serve(() => server);
    vi.mocked(ActivityActions.updateActivity).mockResolvedValue({ ok: true, activity: moved });
    const screen = await renderTimeline(range(1, 20), 45);
    await page.getByRole('button', { name: 'Show older' }).click();
    // Up to A20's time: A20 again (left out), then A21 to A39.
    await expect.element(item('A39')).toBeVisible();

    server = after;
    await page.getByRole('button', { name: 'Edit A5' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    // The refresh after the save: the server's first page no longer holds A5.
    await screen.rerender(timeline(after.slice(0, 20), 45));
    await page.getByRole('button', { name: 'Show older' }).click();

    await expect.element(item('A45')).toBeVisible();
    // Each once, the moved one last, asked after the last one the server gave (not the edit).
    expect(subjects()).toStrictEqual(after.map((each) => each.subject));
    expect(asked()).toStrictEqual([
      { page: 0, to: justAfter(activity(20, 'A20')) },
      { page: 0, to: justAfter(activity(39, 'A39')) },
    ]);
    await expect.element(page.getByRole('button', { name: 'Show older' })).not.toBeInTheDocument();
  });

  it('skips none when a teammate deleted one shown between two loads', async () => {
    let server = range(1, 45);
    serve(() => server);
    await renderTimeline(range(1, 20), 45);
    await page.getByRole('button', { name: 'Show older' }).click();
    await expect.element(item('A39')).toBeVisible();

    // Someone else deleted A3, and this page wasn't refreshed: what follows moved up by one.
    server = range(1, 45).filter((each) => each.id !== 3);
    await page.getByRole('button', { name: 'Show older' }).click();

    await expect.element(item('A45')).toBeVisible();
    expect(subjects()).toStrictEqual(range(1, 45).map((each) => each.subject));
  });

  it('stops asking after as many pages as there are, plus one, when none brings anything new', async () => {
    // A server answering every page with what is shown: the loop must end all the same.
    vi.mocked(ActivityActions.loadActivities)
      .mockReset()
      .mockImplementation(async () => {
        const tick = Promise.withResolvers<undefined>();
        setTimeout(tick.resolve, 1);
        await tick.promise;
        return FIRST_PAGE;
      });
    await renderTimeline(FIRST_PAGE, 22);
    const showOlder = page.getByRole('button', { name: 'Show older' });

    await showOlder.click();

    await expect.element(showOlder).toHaveAttribute('aria-disabled', 'true');
    await expect.element(showOlder).not.toHaveAttribute('aria-disabled');
    expect(ActivityActions.loadActivities).toHaveBeenCalledTimes(Math.ceil(22 / 20) + 1);
  });

  describe('while teammates log more than a page meanwhile', () => {
    it('asks only for what is older than the last one shown, so the newer ones move nothing', async () => {
      // 22 activities logged after the page was read (A-21 to A0): they wait for a refresh.
      serve(() => range(-21, 45));
      await renderTimeline(range(1, 20), 45);

      await page.getByRole('button', { name: 'Show older' }).click();

      await expect.element(item('A39')).toBeVisible();
      expect(asked()).toStrictEqual([{ page: 0, to: justAfter(activity(20, 'A20')) }]);
      expect(subjects()).toStrictEqual(range(1, 39).map((each) => each.subject));
      await expect.element(page.getByRole('heading', { name: 'A21', exact: true })).toHaveFocus();
    });

    it('leaves no gap when a refreshed first page is all new activities, older pages loaded', async () => {
      let server = range(1, 45);
      serve(() => server);
      const screen = await renderTimeline(range(1, 20), 45);
      await page.getByRole('button', { name: 'Show older' }).click();
      await expect.element(item('A39')).toBeVisible();

      // 22 logged meanwhile, then a refresh: the first page is all new (A-21 to A-2).
      server = range(-21, 45);
      await screen.rerender(timeline(range(-21, -2), 67));
      await page.getByRole('button', { name: 'Show older' }).click();

      await expect.element(item('A17')).toBeVisible();
      // Each once, and A-1 and A0, between the new page and the older ones, not skipped.
      expect(subjects()).toStrictEqual(range(-21, 17).map((each) => each.subject));
      expect(asked()).toStrictEqual([
        { page: 0, to: justAfter(activity(20, 'A20')) },
        { page: 0, to: justAfter(activity(-2, 'A-2')) },
      ]);
    });
  });
});
