import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { searchRecords } from '@/actions/crm/RecordSearchActions';
import type { createTask, updateTask } from '@/actions/crm/TaskActions';
import en from '@/locales/en.json';
import { GetStarted } from './GetStarted';

type Props = Parameters<typeof GetStarted>[0];

// The task dialog imports its actions and the record pickers' search.
vi.mock(import('@/actions/crm/TaskActions'), () => ({
  createTask: vi.fn<typeof createTask>(),
  updateTask: vi.fn<typeof updateTask>(),
}));
vi.mock(import('@/actions/crm/RecordSearchActions'), () => ({
  searchRecords: vi.fn<typeof searchRecords>(),
}));

const props = (extra: Partial<Props> = {}): Props => ({
  workspace: { id: 1, timezone: 'UTC', permissions: ['MEMBERS_MANAGE', 'RECORDS_ASSIGN'] },
  members: [{ userId: 3, email: 'avery@acme.test', displayName: 'Avery Owner' }],
  me: 3,
  ...extra,
});

const links = (name: string) => page.getByRole('link', { name });

const started = async (value: Props) =>
  await render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <GetStarted {...value} />
    </NextIntlClientProvider>,
  );

describe(GetStarted, () => {
  it('offers the five create actions and the members page, and no seal', async () => {
    await started(props());

    await expect.element(links('New company')).toHaveAttribute('href', '/app/1/companies/new');
    await expect.element(links('New contact')).toHaveAttribute('href', '/app/1/contacts/new');
    await expect.element(links('New lead')).toHaveAttribute('href', '/app/1/leads/new');
    await expect.element(links('New deal')).toHaveAttribute('href', '/app/1/deals/new');
    await expect.element(page.getByRole('button', { name: 'New task' })).toBeVisible();
    await expect
      .element(links('Invite your team'))
      .toHaveAttribute('href', '/app/1/settings/members');
    // A seal is only ever someone's signature: nothing here has been signed.
    expect(document.querySelector('[class*="border-seal-ink"][class*="rounded-full"]')).toBeNull();
  });

  it('only offers to see the team to someone who cannot invite', async () => {
    await started(props({ workspace: { id: 1, timezone: 'UTC', permissions: [] } }));

    await expect
      .element(page.getByRole('link', { name: 'See your team' }))
      .toHaveAttribute('href', '/app/1/settings/members');
    expect(page.getByRole('link', { name: 'Invite your team' }).elements()).toHaveLength(0);
  });
});
