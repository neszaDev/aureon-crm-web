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
    expect(ActivityActions.loadActivities).toHaveBeenCalledWith(1, { companyId: 7 }, 1);
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

  it('asks for the page after the last one it holds when an activity was moved past the pages shown', async () => {
    // 45 activities, A1 to A45. A5 is edited to the oldest time of all: the server then has
    // A1-A4 and A6-A45, then A5 (page 1 starts at A22, page 2 at A42).
    const all = Array.from({ length: 45 }, (_, index) => activity(index + 1, `A${index + 1}`));
    const moved = { ...activity(60, 'A5 moved'), id: 5, version: 1 };
    const after = [...all.filter((each) => each.id !== 5), moved];
    let server = all;
    vi.mocked(ActivityActions.loadActivities)
      .mockReset()
      .mockImplementation(
        async (_workspaceId, _link, pageNumber) =>
          await Promise.resolve(server.slice(pageNumber * 20, pageNumber * 20 + 20)),
      );
    vi.mocked(ActivityActions.updateActivity).mockResolvedValue({ ok: true, activity: moved });
    const screen = await renderTimeline(all.slice(0, 20), 45);
    await page.getByRole('button', { name: 'Show older' }).click();
    await expect.element(item('A40')).toBeVisible();

    server = after;
    await page.getByRole('button', { name: 'Edit A5' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    // The refresh after the save: the server's first page no longer holds A5.
    await screen.rerender(timeline(after.slice(0, 20), 45));
    await page.getByRole('button', { name: 'Show older' }).click();
    await expect.element(item('A41')).toBeVisible();
    await page.getByRole('button', { name: 'Show older' }).click();

    await expect.element(item('A45')).toBeVisible();
    // Each once, the moved one last; A41 was not skipped, and no page was asked for twice.
    expect(subjects()).toStrictEqual(after.map((each) => each.subject));
    expect(
      vi.mocked(ActivityActions.loadActivities).mock.calls.map((call) => call[2]),
    ).toStrictEqual([1, 1, 2]);
    await expect.element(page.getByRole('button', { name: 'Show older' })).not.toBeInTheDocument();
  });
});
