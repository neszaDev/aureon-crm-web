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
  signatures: [],
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

const board = (
  over: Partial<Parameters<typeof DealBoard>[0]> = {},
  columns: Column[] = COLUMNS,
) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <p>Outside the board</p>
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
  </NextIntlClientProvider>
);

const renderBoard = async (
  over: Partial<Parameters<typeof DealBoard>[0]> = {},
  columns: Column[] = COLUMNS,
) => await render(board(over, columns));

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

// A moment for the drag to measure itself, waited out by polling the clock.
const pause = async () => {
  const start = performance.now();
  await expect.poll(() => performance.now() - start, { interval: 20 }).toBeGreaterThan(80);
};

const centre = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

const send = (type: string, to: EventTarget, point: { x: number; y: number }) =>
  to.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      buttons: type === 'pointerup' ? 0 : 1,
      clientX: point.x,
      clientY: point.y,
    }),
  );

/**
 * Drags with the pointer, in the steps a hand takes: press on the source, move a little (which
 * starts the drag), move to the target's centre, release. The drag measures itself between the
 * events, so each waits for a moment.
 * @param source The handle.
 * @param target Where to release.
 */
const pointerDrag = async (source: Element, target: Element) => {
  const from = centre(source);
  send('pointerdown', source, from);
  await pause();
  send('pointermove', document, { x: from.x + 24, y: from.y + 8 });
  await pause();
  send('pointermove', document, centre(target));
  await pause();
  send('pointerup', document, centre(target));
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

  it('moves a card dropped on a column with the pointer', async () => {
    vi.mocked(DealActions.moveDeal).mockResolvedValue({ ok: true, version: 4 });
    await renderBoard();

    await pointerDrag(handle('D-0101 Mine to move').element(), column('Proposal').element());

    await expect
      .element(column('Proposal').getByRole('link', { name: 'Mine to move' }))
      .toBeVisible();
    expect(DealActions.moveDeal).toHaveBeenCalledExactlyOnceWith(1, 101, {
      stageId: 12,
      version: 3,
      lostReason: undefined,
    });
  });

  it('moves nothing when a card is released outside every column', async () => {
    await renderBoard();

    await pointerDrag(
      handle('D-0101 Mine to move').element(),
      page.getByText('Outside the board').element(),
    );

    // The drop is cancelled: said so, and no move, no dialog, the card where it was.
    await expect.element(page.getByText('Moving Mine to move was cancelled.')).toBeInTheDocument();
    expect(DealActions.moveDeal).not.toHaveBeenCalled();
    expect(page.getByRole('dialog').elements()).toHaveLength(0);
    await expect
      .element(column('Qualification').getByRole('link', { name: 'Mine to move' }))
      .toBeVisible();
  });

  it('closes a deal as won with a drop on Won, and the card shows it', async () => {
    vi.mocked(DealActions.moveDeal).mockResolvedValue({ ok: true, version: 4 });
    await renderBoard();

    await drag('D-0101 Mine to move', 2);

    const won = column('Won').getByRole('link', { name: 'Mine to move' });

    await expect.element(won).toBeVisible();
    expect(DealActions.moveDeal).toHaveBeenCalledExactlyOnceWith(1, 101, {
      stageId: 13,
      version: 3,
      lostReason: undefined,
    });
    await expect.element(column('Won').getByText('Won: reached')).toBeInTheDocument();
  });

  it('puts a card back, with the toast, when a move to Lost with its reason is refused', async () => {
    vi.mocked(DealActions.moveDeal).mockResolvedValue({
      ok: false,
      message: "Your role doesn't allow this.",
    });
    await renderBoard();
    await drag('D-0101 Mine to move', 3);

    await page.getByLabelText('Reason').fill('Went with a rival');
    await page.getByRole('button', { name: 'Mark as lost' }).click();

    await expect.element(page.getByText("Your role doesn't allow this.")).toBeVisible();
    await expect
      .element(column('Qualification').getByRole('link', { name: 'Mine to move' }))
      .toBeVisible();
    expect(column('Lost').getByRole('link', { name: 'Mine to move' }).elements()).toHaveLength(0);
  });

  it('moves a card again with the version its first move returned, before any refresh', async () => {
    vi.mocked(DealActions.moveDeal).mockResolvedValue({ ok: true, version: 4 });
    await renderBoard();
    await drag('D-0101 Mine to move', 1);
    await expect
      .element(column('Proposal').getByRole('link', { name: 'Mine to move' }))
      .toBeVisible();

    await drag('D-0101 Mine to move', 1);

    await expect.element(column('Won').getByRole('link', { name: 'Mine to move' })).toBeVisible();
    expect(DealActions.moveDeal).toHaveBeenLastCalledWith(1, 101, {
      stageId: 13,
      version: 4,
      lostReason: undefined,
    });
  });

  it('shows the server again once a refresh brings new columns, not the move it answered', async () => {
    vi.mocked(DealActions.moveDeal).mockResolvedValue({ ok: true, version: 4 });
    const screen = await renderBoard();
    await drag('D-0101 Mine to move', 1);
    await expect
      .element(column('Proposal').getByRole('link', { name: 'Mine to move' }))
      .toBeVisible();

    // Someone else then moved it to Won: the refresh shows it there, not where this board put it.
    const moved = {
      ...MINE,
      stage: { id: 13, name: 'Won', kind: 'WON' as const },
      status: 'WON' as const,
      version: 5,
    };
    await screen.rerender(
      board({}, [
        { ...FIRST_COLUMN, count: 1, deals: [RILEYS] },
        { stage: PROPOSAL, count: 0, totals: [], deals: [] },
        { stage: WON, count: 1, totals: [], deals: [moved] },
        { stage: LOST, count: 0, totals: [], deals: [] },
      ]),
    );

    await expect.element(column('Won').getByRole('link', { name: 'Mine to move' })).toBeVisible();
    expect(column('Proposal').getByRole('link', { name: 'Mine to move' }).elements()).toHaveLength(
      0,
    );
  });

  it('keeps the focus on the moved card after a keyboard drop', async () => {
    vi.mocked(DealActions.moveDeal).mockResolvedValue({ ok: true, version: 4 });
    await renderBoard();

    await drag('D-0101 Mine to move', 1);

    await expect
      .element(column('Proposal').getByRole('link', { name: 'Mine to move' }))
      .toBeVisible();
    await expect.element(handle('D-0101 Mine to move')).toHaveFocus();
  });

  it('keeps a pending move on a card that cannot be picked up again until it is answered', async () => {
    const answer = Promise.withResolvers<Move>();
    vi.mocked(DealActions.moveDeal).mockReturnValue(answer.promise);
    await renderBoard();

    await drag('D-0101 Mine to move', 1);
    await drag('D-0101 Mine to move', 1);

    expect(DealActions.moveDeal).toHaveBeenCalledOnce();
    answer.resolve({ ok: true, version: 4 });
  });

  it('does not offer a menu move for a card whose drag move is on its way', async () => {
    const answer = Promise.withResolvers<Move>();
    vi.mocked(DealActions.moveDeal).mockReturnValue(answer.promise);
    await renderBoard();

    await drag('D-0101 Mine to move', 1);
    await page.getByRole('button', { name: 'Actions for Mine to move' }).click();

    await expect.element(page.getByRole('menuitem', { name: 'Move to…' })).toBeDisabled();
    answer.resolve({ ok: true, version: 4 });
  });

  it('reveals a card\u2019s handle and menu on hover only where there is hover', async () => {
    await renderBoard();

    const controls = handle('D-0101 Mine to move').element().parentElement;

    expect(controls?.className).toContain('[@media(hover:hover)]:md:opacity-0');
    expect(controls?.className).not.toMatch(/(^| )md:opacity-0/u);
  });

  it('keeps the deal’s name in the Lost dialog’s title while it closes', async () => {
    await renderBoard();
    await drag('D-0101 Mine to move', 3);
    await expect
      .element(page.getByRole('dialog', { name: 'Mark Mine to move as lost' }))
      .toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();

    // Right after the click the dialog is still fading out, with its title as it was.
    expect(document.body.textContent).not.toContain('Mark  as lost');
  });

  it('gives the focus back to the card’s handle when the Lost dialog is cancelled', async () => {
    await renderBoard();
    await drag('D-0101 Mine to move', 3);
    await expect
      .element(page.getByRole('dialog', { name: 'Mark Mine to move as lost' }))
      .toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect.element(handle('D-0101 Mine to move')).toHaveFocus();
  });

  it('puts the focus on the handle of the card moved to Lost, once its reason is given', async () => {
    vi.mocked(DealActions.moveDeal).mockResolvedValue({ ok: true, version: 4 });
    await renderBoard();
    await drag('D-0101 Mine to move', 3);

    await page.getByLabelText('Reason').fill('Went with a rival');
    await page.getByRole('button', { name: 'Mark as lost' }).click();

    await expect.element(column('Lost').getByRole('link', { name: 'Mine to move' })).toBeVisible();
    await expect.element(handle('D-0101 Mine to move')).toHaveFocus();
  });
});
