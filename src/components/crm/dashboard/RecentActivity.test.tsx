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
import type { components } from '@/libs/api/schema';
import en from '@/locales/en.json';
import { RecentActivity } from './RecentActivity';

type Activity = components['schemas']['ActivityResponse'];

// The entries import the timeline's actions.
vi.mock(import('@/actions/crm/ActivityActions'), () => ({
  loadActivities: vi.fn<typeof loadActivities>(),
  logActivity: vi.fn<typeof logActivity>(),
  updateActivity: vi.fn<typeof updateActivity>(),
  deleteActivity: vi.fn<typeof deleteActivity>(),
}));

const activity = (id: number, subject: string, extra: Partial<Activity> = {}): Activity => ({
  id,
  type: 'CALL',
  subject,
  occurredAt: '2026-10-18T13:00:00Z',
  author: { userId: 3, email: 'riley@acme.test', displayName: 'Riley Rep' },
  company: { id: 7, name: 'Acme' },
  createdAt: '2026-10-18T13:00:00Z',
  updatedAt: '2026-10-18T13:00:00Z',
  version: 1,
  ...extra,
});

const recent = async (activities: Activity[]) =>
  await render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <RecentActivity activities={activities} workspaceId={1} timeZone="Asia/Bangkok" />
    </NextIntlClientProvider>,
  );

describe(RecentActivity, () => {
  it('lists the entries as a feed, read-only, each by its author, with every record it is on', async () => {
    await recent([
      activity(1, 'Site visit', { body: 'Walked the floor' }),
      activity(2, 'Sent the price list', { deal: { id: 9, name: 'Renewal' } }),
      activity(3, 'Old note', { type: 'NOTE', author: undefined }),
    ]);

    await expect.element(page.getByRole('heading', { name: 'Recent activity' })).toBeVisible();
    await expect.element(page.getByRole('heading', { name: 'Site visit' })).toBeVisible();
    await expect.element(page.getByText('Walked the floor')).toBeVisible();
    // Who logged it, with their avatar, its type and when, in the workspace's time zone.
    const first = page.getByRole('listitem').first();
    await expect.element(first).toHaveTextContent(/^RRRiley RepCallOct 18, 2026, 8:00.PM/u);
    await expect.element(page.getByText('A former member')).toBeVisible();
    // The records are links; nothing is left out, since no record is being viewed.
    await expect
      .element(page.getByRole('link', { name: 'Renewal' }))
      .toHaveAttribute('href', '/app/1/deals/9');
    expect(page.getByRole('link', { name: 'Acme' }).elements()).toHaveLength(3);
    // The caller may not edit or delete here, even their own entry.
    expect(page.getByRole('button').elements()).toHaveLength(0);
  });

  it('says so when nothing has been logged', async () => {
    await recent([]);

    await expect.element(page.getByText('No activity logged yet.')).toBeVisible();
  });
});
