import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
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

describe(ActivityTimeline, () => {
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
});
