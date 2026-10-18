import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { moveDeal } from '@/actions/crm/DealActions';
import * as DealActions from '@/actions/crm/DealActions';
import { Toaster } from '@/components/ui/sonner';
import type { components } from '@/libs/api/schema';
import messages from '@/locales/en.json';
// Dragging measures the layout, and the phone layout hides columns: the real styles are needed.
import '@/styles/global.css';
import { DealBoard } from './DealBoard';

type Column = components['schemas']['BoardColumn'];
type Deal = components['schemas']['DealSummary'];
type Move = Awaited<ReturnType<typeof moveDeal>>;

vi.mock(import('@/actions/crm/DealActions'), () => ({ moveDeal: vi.fn<typeof moveDeal>() }));

const MIA = { userId: 1, email: 'mia@acme.test', displayName: 'Mia Manager' };
const RILEY = { userId: 2, email: 'riley@acme.test', displayName: 'Riley Rep' };
const NOW = new Date('2026-10-18T12:00:00Z');

const stage = (id: number, name: string, kind: Column['stage']['kind']): Column['stage'] => ({
  id,
  name,
  kind,
  position: id,
  probability: 10,
  dealCount: 0,
  version: 1,
});
const QUALIFICATION = stage(11, 'Qualification', 'OPEN');
const PROPOSAL = stage(12, 'Proposal', 'OPEN');
const WON = stage(13, 'Won', 'WON');
const LOST = stage(14, 'Lost', 'LOST');

const deal = (over: Partial<Deal> & Pick<Deal, 'id' | 'name'>): Deal => ({
  amount: '1000.00',
  currency: 'EUR',
  stage: { id: 11, name: 'Qualification', kind: 'OPEN' },
  stageEnteredAt: '2026-10-10T09:00:00Z',
  status: 'OPEN',
  probability: 10,
  owner: MIA,
  company: { id: 7, name: 'Acme' },
  archived: false,
  updatedAt: '2026-10-10T09:00:00Z',
  version: 3,
  ...over,
});

const MINE = deal({ id: 101, name: 'Mine to move' });
const RILEYS = deal({
  id: 102,
  name: 'Riley deal',
  owner: RILEY,
  amount: '500.00',
  currency: 'USD',
});

const FIRST_COLUMN: Column = {
  stage: QUALIFICATION,
  count: 2,
  // Two currencies: two figures, never one sum.
  totals: [
    { currency: 'EUR', amount: '1000.00' },
    { currency: 'USD', amount: '500.00' },
  ],
  deals: [MINE, RILEYS],
};
const COLUMNS: Column[] = [
  FIRST_COLUMN,
  { stage: PROPOSAL, count: 0, totals: [], deals: [] },
  { stage: WON, count: 0, totals: [], deals: [] },
  { stage: LOST, count: 0, totals: [], deals: [] },
];

const renderBoard = async (
  over: Partial<Parameters<typeof DealBoard>[0]> = {},
  columns: Column[] = COLUMNS,
) => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <DealBoard
        workspaceId={1}
        columns={columns}
        me={1}
        permissions={[]}
        path="/app/1/deals"
        query={{ params: { q: 'acme' } }}
        now={NOW}
        {...over}
      />
      <Toaster />
    </NextIntlClientProvider>,
  );
};

const column = (name: string) => page.getByRole('region', { name, exact: true });
const card = (name: string) => page.getByRole('link', { name, exact: true });
const handle = (name: string) => page.getByRole('button', { name: `Drag ${name}` });

/**
 * Picks a card up by its handle with the keyboard, moves it by columns and drops it.
 * @param name The handle's name.
 * @param columns How many columns to the right (negative: left).
 */
const drag = async (name: string, columns: number) => {
  handle(name).element().focus();
  await userEvent.keyboard(' ');
  await userEvent.keyboard(
    (columns > 0 ? '{ArrowRight}' : '{ArrowLeft}').repeat(Math.abs(columns)),
  );
  await userEvent.keyboard(' ');
};

describe(DealBoard, () => {
  beforeEach(async () => {
    vi.mocked(DealActions.moveDeal).mockReset();
    await page.viewport(1280, 900);
  });

  it('lists a column by stage with its count and a total for each currency', async () => {
    await renderBoard();

    const qualification = column('Qualification');

    const totals = qualification.getByRole('list', { name: 'Total value' });

    await expect.element(totals.getByText('€1,000.00')).toBeVisible();
    await expect.element(totals.getByText('$500.00')).toBeVisible();
    expect(totals.getByRole('listitem').elements()).toHaveLength(2);
    await expect.element(qualification.getByText('2 deals')).toBeVisible();
    await expect.element(card('Mine to move')).toBeVisible();
    await expect.element(column('Proposal').getByText('No deals')).toBeVisible();
  });

  it('shows a card with its number, company, amount and owner', async () => {
    await renderBoard();

    const qualification = column('Qualification');

    await expect.element(qualification.getByText('D-0101')).toBeVisible();
    await expect.element(qualification.getByText('Acme').first()).toBeVisible();
    await expect
      .element(qualification.getByRole('img', { name: 'Mia Manager' }).first())
      .toBeVisible();
    // The compact stamp row on the card.
    await expect.element(qualification.getByText('8d').first()).toBeVisible();
  });

  it('moves a dropped card at once and keeps it there once the move is saved', async () => {
    const answer = Promise.withResolvers<Move>();
    vi.mocked(DealActions.moveDeal).mockReturnValue(answer.promise);
    await renderBoard();

    await drag('D-0101 Mine to move', 1);

    // Before the answer: the card is already in Proposal.
    await expect
      .element(column('Proposal').getByRole('link', { name: 'Mine to move' }))
      .toBeVisible();
    expect(
      column('Qualification').getByRole('link', { name: 'Mine to move' }).elements(),
    ).toHaveLength(0);
    expect(DealActions.moveDeal).toHaveBeenCalledExactlyOnceWith(1, 101, {
      stageId: 12,
      version: 3,
      lostReason: undefined,
    });

    answer.resolve({ ok: true, version: 4 });

    await expect
      .element(column('Proposal').getByRole('link', { name: 'Mine to move' }))
      .toBeVisible();
  });

  it('puts the card back and says why when the backend refuses the move', async () => {
    const answer = Promise.withResolvers<Move>();
    vi.mocked(DealActions.moveDeal).mockReturnValue(answer.promise);
    await renderBoard();

    await drag('D-0101 Mine to move', 1);
    await expect
      .element(column('Proposal').getByRole('link', { name: 'Mine to move' }))
      .toBeVisible();
    answer.resolve({ ok: false, message: "Your role doesn't allow this." });

    await expect.element(page.getByText("Your role doesn't allow this.")).toBeVisible();
    await expect
      .element(column('Qualification').getByRole('link', { name: 'Mine to move' }))
      .toBeVisible();
    expect(column('Proposal').getByRole('link', { name: 'Mine to move' }).elements()).toHaveLength(
      0,
    );
  });

  it('offers a reload when someone else changed the deal first', async () => {
    vi.mocked(DealActions.moveDeal).mockResolvedValue({
      ok: false,
      conflict: true,
      message: 'Someone else changed this. Reload to see their version.',
    });
    await renderBoard();

    await drag('D-0101 Mine to move', 1);

    await expect
      .element(page.getByText('Someone else changed this. Reload to see their version.'))
      .toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Reload' })).toBeVisible();
    await expect
      .element(column('Qualification').getByRole('link', { name: 'Mine to move' }))
      .toBeVisible();
  });

  it('puts the card back and says so when the request never gets through', async () => {
    vi.mocked(DealActions.moveDeal).mockRejectedValue(new Error('Failed to fetch'));
    await renderBoard();

    await drag('D-0101 Mine to move', 1);

    await expect
      .element(page.getByText("Couldn't reach the server. Check your connection and try again."))
      .toBeVisible();
    await expect
      .element(column('Qualification').getByRole('link', { name: 'Mine to move' }))
      .toBeVisible();
  });

  it('asks why before a card is dropped on Lost, and cancelling leaves the card where it was', async () => {
    await renderBoard();

    await drag('D-0101 Mine to move', 3);

    await expect
      .element(page.getByRole('dialog', { name: 'Mark Mine to move as lost' }))
      .toBeVisible();
    expect(DealActions.moveDeal).not.toHaveBeenCalled();

    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
    expect(DealActions.moveDeal).not.toHaveBeenCalled();
    await expect
      .element(column('Qualification').getByRole('link', { name: 'Mine to move' }))
      .toBeVisible();
    expect(column('Lost').getByRole('link', { name: 'Mine to move' }).elements()).toHaveLength(0);
  });

  it('needs a reason to mark a deal lost, then moves it with the reason', async () => {
    vi.mocked(DealActions.moveDeal).mockResolvedValue({ ok: true, version: 4 });
    await renderBoard();
    await drag('D-0101 Mine to move', 3);

    await page.getByRole('button', { name: 'Mark as lost' }).click();

    await expect.element(page.getByText('Required')).toBeVisible();
    expect(DealActions.moveDeal).not.toHaveBeenCalled();

    await page.getByLabelText('Reason').fill('Went with a rival');
    await page.getByRole('button', { name: 'Mark as lost' }).click();

    await expect.element(column('Lost').getByRole('link', { name: 'Mine to move' })).toBeVisible();
    expect(DealActions.moveDeal).toHaveBeenCalledExactlyOnceWith(1, 101, {
      stageId: 14,
      version: 3,
      lostReason: 'Went with a rival',
    });
  });

  it('does not drag or offer a move for a card the caller cannot move', async () => {
    await renderBoard();

    await expect.element(handle('D-0101 Mine to move')).toBeVisible();
    expect(handle('D-0102 Riley deal').elements()).toHaveLength(0);
    expect(page.getByRole('button', { name: 'Actions for Riley deal' }).elements()).toHaveLength(0);
    await expect
      .element(page.getByRole('button', { name: 'Actions for Mine to move' }))
      .toBeVisible();
  });

  it('lets a member with RECORDS_EDIT_ANY move any card', async () => {
    await renderBoard({ permissions: ['RECORDS_EDIT_ANY'] });

    await expect.element(handle('D-0102 Riley deal')).toBeVisible();
  });

  it('moves a card from its menu, with the version it was read at', async () => {
    vi.mocked(DealActions.moveDeal).mockResolvedValue({ ok: true, version: 4 });
    await renderBoard();

    await page.getByRole('button', { name: 'Actions for Mine to move' }).click();
    await page.getByRole('menuitem', { name: 'Move to…' }).click();
    await page.getByLabelText('Stage', { exact: true }).selectOptions('12');
    await page.getByRole('button', { name: 'Move deal' }).click();

    expect(DealActions.moveDeal).toHaveBeenCalledExactlyOnceWith(1, 101, {
      stageId: 12,
      version: 3,
      lostReason: undefined,
    });
  });

  it('shows a refused menu move inside the dialog', async () => {
    vi.mocked(DealActions.moveDeal).mockResolvedValue({
      ok: false,
      message: "Your role doesn't allow this.",
    });
    await renderBoard();

    await page.getByRole('button', { name: 'Actions for Mine to move' }).click();
    await page.getByRole('menuitem', { name: 'Move to…' }).click();
    await page.getByLabelText('Stage', { exact: true }).selectOptions('12');
    await page.getByRole('button', { name: 'Move deal' }).click();

    await expect
      .element(page.getByRole('dialog').getByText("Your role doesn't allow this."))
      .toBeVisible();
  });

  it('points to the list when a column holds more deals than it shows', async () => {
    await renderBoard({}, [{ ...FIRST_COLUMN, count: 63 }, ...COLUMNS.slice(1)]);

    await expect.element(column('Qualification').getByText(/Showing 2 of 63/u)).toBeVisible();
    await expect
      .element(column('Qualification').getByRole('link', { name: 'open the list' }))
      .toHaveAttribute('href', '/app/1/deals?q=acme&view=list&stageId=11');
  });

  it('shows one column at a time on a phone, chosen with a stage select', async () => {
    await page.viewport(390, 800);
    await renderBoard();

    // The other columns are hidden, so they are out of the page's tree.
    await expect.element(column('Qualification')).toBeVisible();
    await expect.element(column('Proposal')).not.toBeInTheDocument();
    // No dragging on a phone: the card menu moves it.
    expect(handle('D-0101 Mine to move').elements()).toHaveLength(0);
    await expect
      .element(page.getByRole('button', { name: 'Actions for Mine to move' }))
      .toBeVisible();

    await page.getByLabelText('Stage shown').selectOptions('12');

    await expect.element(column('Proposal')).toBeVisible();
    await expect.element(column('Qualification')).not.toBeInTheDocument();
  });
});
