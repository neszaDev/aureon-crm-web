import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import en from '@/locales/en.json';
import '@/styles/global.css';
import { MyDeals } from './MyDeals';

type Props = Parameters<typeof MyDeals>[0];

const STAGES: Props['stages'] = [
  { id: 1, name: 'Qualification', kind: 'OPEN' },
  { id: 2, name: 'Proposal', kind: 'OPEN' },
  { id: 3, name: 'Won', kind: 'WON' },
  { id: 4, name: 'Lost', kind: 'LOST' },
];
const RILEY = { userId: 3, email: 'riley@acme.test', displayName: 'Riley Rep' };
const deal = (id: number, name: string, extra: Partial<Props['deals'][number]> = {}) => ({
  id,
  name,
  amount: '4500.00',
  currency: 'EUR',
  archived: false,
  probability: 20,
  status: 'OPEN' as const,
  stage: STAGES[1] ?? { id: 2, name: 'Proposal', kind: 'OPEN' as const },
  stageEnteredAt: '2026-10-10T09:00:00Z',
  signatures: [{ stageId: 1, by: RILEY }],
  updatedAt: '2026-10-17T09:00:00Z',
  version: 1,
  ...extra,
});

const props = (extra: Partial<Props> = {}): Props => ({
  deals: [deal(9, 'Lumen first order', { company: { id: 4, name: 'Lumen Works' } })],
  total: 7,
  stages: STAGES,
  workspaceId: 1,
  me: 3,
  now: new Date('2026-10-18T12:00:00Z'),
  timeZone: 'UTC',
  ...extra,
});

const mine = async (value: Props) =>
  await render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <MyDeals {...value} />
    </NextIntlClientProvider>,
  );

describe(MyDeals, () => {
  it("shows the caller's deals with number, amount and the status track", async () => {
    await mine(props());

    await expect.element(page.getByRole('heading', { name: 'My deals' })).toBeVisible();
    await expect.element(page.getByText('7 open')).toBeVisible();
    await expect
      .element(page.getByRole('link', { name: 'Lumen first order' }))
      .toHaveAttribute('href', '/app/1/deals/9');
    await expect.element(page.getByText('D-0009')).toBeVisible();
    await expect.element(page.getByText('€4,500.00')).toBeVisible();
    await expect.element(page.getByText('Lumen Works')).toBeVisible();
    // Riley moved the deal into Qualification; the current stage counts its days.
    const row = page.getByRole('list', { name: 'Stage 2 of 2: Proposal' });
    await expect.element(row).toBeVisible();
    expect(row.element().textContent).toContain('Qualification: reached, moved here by Riley Rep');
    expect(row.element().textContent).toContain('Proposal: current, 8 days');
  });

  it("links to the caller's open deals in the list", async () => {
    await mine(props());

    await expect
      .element(page.getByRole('link', { name: 'All my deals' }))
      .toHaveAttribute('href', '/app/1/deals?view=list&status=OPEN&ownerId=3');
  });

  it('says so when the caller has no open deals, and offers a new one', async () => {
    await mine(props({ deals: [], total: 0 }));

    await expect.element(page.getByText('No open deals of yours')).toBeVisible();
    await expect
      .element(page.getByRole('link', { name: 'New deal' }))
      .toHaveAttribute('href', '/app/1/deals/new');
    expect(page.getByRole('link', { name: 'All my deals' }).elements()).toHaveLength(0);
  });
});
