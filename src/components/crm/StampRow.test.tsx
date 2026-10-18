import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
// The box size and the press are styles.
import '@/styles/global.css';
import { StampRow } from './StampRow';

type Props = Parameters<typeof StampRow>[0];

const STAGES: Props['stages'] = [
  { id: 1, name: 'Qualification', kind: 'OPEN' },
  { id: 2, name: 'Proposal', kind: 'OPEN' },
  { id: 3, name: 'Negotiation', kind: 'OPEN' },
  { id: 4, name: 'Won', kind: 'WON' },
  { id: 5, name: 'Lost', kind: 'LOST' },
];
const MIA = { userId: 1, email: 'mia@acme.test', displayName: 'Mia Manager' };
const RILEY = { userId: 2, email: 'riley@acme.test', displayName: 'Riley Rep' };
const NOW = new Date('2026-10-18T12:00:00Z');
// Eight whole days before NOW.
const ENTERED = '2026-10-10T09:00:00Z';

const row = (props: Partial<Props>): Props => ({
  stages: STAGES,
  current: { stageId: 2, kind: 'OPEN', enteredAt: ENTERED },
  now: NOW,
  size: 'full',
  ...props,
});

const renderRow = async (props: Props) =>
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <StampRow {...props} />
    </NextIntlClientProvider>,
  );

// Each box's accessible name, which the screen-reader text of its item gives.
const names = () =>
  page
    .getByRole('listitem')
    .elements()
    .map((item) => item.querySelector('.sr-only')?.textContent);
const boxes = () => page.getByRole('listitem').elements();

describe(StampRow, () => {
  it('names the boxes by state: reached and signed, current with its days, not reached', async () => {
    await renderRow(row({ signatures: { 1: MIA, 2: RILEY } }));

    await expect.element(page.getByRole('list', { name: 'Deal progress' })).toBeVisible();
    // One box for each open stage and one closing box (Won while the deal is open).
    expect(names()).toStrictEqual([
      'Qualification: reached, signed by Mia Manager',
      'Proposal: current, 8 days',
      'Negotiation: not reached',
      'Won: not reached',
    ]);
  });

  it('shows the exact days in the open box, not a rounded figure', async () => {
    await renderRow(row({}));

    await expect.element(page.getByText('8d')).toBeVisible();
  });

  it('counts a single day in the singular', async () => {
    await renderRow(
      row({ current: { stageId: 2, kind: 'OPEN', enteredAt: '2026-10-17T09:00:00Z' } }),
    );

    expect(names()[1]).toBe('Proposal: current, 1 day');
  });

  it('draws the seal of whoever moved the deal into a reached stage, and only theirs', async () => {
    await renderRow(row({ signatures: { 1: MIA, 2: RILEY } }));

    // Mia signed Qualification; the open box shows days, never a seal.
    expect(boxes()[0]?.textContent).toContain('MM');
    expect(boxes()[1]?.textContent).not.toContain('RR');
    expect(boxes()[1]?.textContent).toContain('8d');
  });

  it('fills reached boxes without seals in a compact row, and no stage names', async () => {
    await renderRow(row({ size: 'compact', signatures: { 1: MIA } }));

    expect(names()).toStrictEqual([
      'Qualification: reached',
      'Proposal: current, 8 days',
      'Negotiation: not reached',
      'Won: not reached',
    ]);
    expect(boxes()[0]?.textContent).not.toContain('MM');
    // The stage names are only in the boxes' screen-reader text, not printed under them.
    expect(page.getByText('Negotiation', { exact: true }).elements()).toHaveLength(0);
  });

  it('draws every box 36 px, whatever the stage name or the count of days', async () => {
    await renderRow(
      row({
        stages: [
          { id: 1, name: 'A very long stage name that never fits a box', kind: 'OPEN' },
          { id: 2, name: 'Proposal', kind: 'OPEN' },
          { id: 4, name: 'Won', kind: 'WON' },
        ],
        current: { stageId: 2, kind: 'OPEN', enteredAt: '2024-01-01T00:00:00Z' },
      }),
    );

    const sized = boxes().map((item) => item.querySelector('.size-9')?.getBoundingClientRect());

    expect(sized).toHaveLength(3);
    for (const rect of sized) {
      expect([rect?.width, rect?.height]).toStrictEqual([36, 36]);
    }
  });

  it('fills the closing box with the seal colour once the deal is won, signed by whoever won it', async () => {
    await renderRow(
      row({
        current: { stageId: 4, kind: 'WON', enteredAt: ENTERED },
        signatures: { 1: MIA, 2: RILEY, 4: RILEY },
      }),
    );

    expect(names()).toStrictEqual([
      'Qualification: reached, signed by Mia Manager',
      'Proposal: reached, signed by Riley Rep',
      'Negotiation: reached',
      'Won: reached, signed by Riley Rep',
    ]);
    const won = boxes().at(-1)?.querySelector('.size-9');

    expect(won).toHaveClass('bg-seal');
    expect(won?.textContent).toContain('RR');
  });

  it('marks a lost deal in ink with the word Lost, never in the seal colour', async () => {
    await renderRow(
      row({
        current: { stageId: 5, kind: 'LOST', enteredAt: ENTERED },
        signatures: { 1: MIA, 5: RILEY },
      }),
    );

    expect(names()).toStrictEqual([
      'Qualification: reached, signed by Mia Manager',
      // The history says nothing of a stage it never entered.
      'Proposal: not shown',
      'Negotiation: not shown',
      'Lost: closed as lost',
    ]);
    const lost = boxes().at(-1)?.querySelector('.size-9');

    expect(lost?.textContent).toContain('Lost');
    // No seal colour anywhere in the box, and no seal: a seal is the signature of a person.
    expect(lost?.outerHTML).not.toMatch(/seal/u);
    expect(lost).toHaveClass('bg-foreground');
  });

  it('does not sign a reached stage the history never shows', async () => {
    await renderRow(
      row({
        current: { stageId: 4, kind: 'WON', enteredAt: ENTERED },
        // Stage 2 was deleted: the history names it but gives no id, so nothing signs it.
        signatures: { 1: MIA },
      }),
    );

    expect(names()[1]).toBe('Proposal: reached');
    expect(boxes()[1]?.textContent).not.toMatch(/[A-Z]{2}/u);
  });

  it('presses the box that becomes current after a move, and not on first load', async () => {
    const screen = await renderRow(row({}));

    expect(document.querySelector('.stamp-press')).toBeNull();

    await screen.rerender(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <StampRow
          {...row({ current: { stageId: 3, kind: 'OPEN', enteredAt: NOW.toISOString() } })}
        />
      </NextIntlClientProvider>,
    );

    const pressed = document.querySelectorAll('.stamp-press');

    expect(pressed).toHaveLength(1);
    expect(pressed[0]?.textContent).toContain('0d');
    // 220 ms, as the design says (the test browser doesn't ask for reduced motion).
    const style = getComputedStyle(pressed[0] ?? document.body);

    expect([style.animationName, style.animationDuration]).toStrictEqual(['stamp-press', '0.22s']);
  });

  it('does not press a compact row', async () => {
    const screen = await renderRow(row({ size: 'compact' }));
    await screen.rerender(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <StampRow
          {...row({
            size: 'compact',
            current: { stageId: 3, kind: 'OPEN', enteredAt: NOW.toISOString() },
          })}
        />
      </NextIntlClientProvider>,
    );

    expect(document.querySelector('.stamp-press')).toBeNull();
  });
});
