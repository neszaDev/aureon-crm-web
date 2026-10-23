import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import en from '@/locales/en.json';
import { StageDistribution } from './StageDistribution';

type Props = Parameters<typeof StageDistribution>[0];

const stage = (id: number, name: string): Props['stages'][number]['stage'] => ({
  id,
  name,
  kind: 'OPEN',
  position: id,
  probability: 10 * id,
  dealCount: 0,
  version: 1,
});
// A fixed response: two currencies in one stage, and a stage without deals.
const STAGES: Props['stages'] = [
  {
    stage: stage(1, 'Qualification'),
    count: 4,
    totals: [
      { currency: 'EUR', amount: '17000.00' },
      { currency: 'USD', amount: '50000.00' },
    ],
  },
  { stage: stage(2, 'Needs analysis'), count: 0, totals: [] },
  { stage: stage(3, 'Proposal'), count: 2, totals: [{ currency: 'USD', amount: '78000.00' }] },
];

const distribution = async (stages: Props['stages']) =>
  await render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <StageDistribution stages={stages} />
    </NextIntlClientProvider>,
  );

const rowOf = (name: string) => page.getByRole('row', { name: new RegExp(name, 'u') });

describe(StageDistribution, () => {
  it('lists every open stage in order, the empty ones too, with its count', async () => {
    await distribution(STAGES);

    const rows = page
      .getByRole('row')
      .elements()
      .slice(1)
      .map((row) => row.querySelector('th')?.textContent);
    expect(rows).toStrictEqual(['Qualification', 'Needs analysis', 'Proposal']);
    await expect.element(rowOf('Needs analysis')).toHaveTextContent('0');
    await expect.element(rowOf('Needs analysis')).toHaveTextContent('None');
    await expect.element(rowOf('Qualification')).toHaveTextContent('4');
  });

  it('keeps EUR and USD apart: one figure for each currency, never added', async () => {
    await distribution(STAGES);

    const cells = rowOf('Qualification').getByRole('listitem').elements();
    expect(cells.map((cell) => cell.textContent)).toStrictEqual(['€17,000.00', '$50,000.00']);
    // No sum of the two, nor of the stages' USD, appears anywhere.
    const text = document.body.textContent;
    expect(text).not.toContain('67,000');
    expect(text).not.toContain('128,000');
  });

  it('draws the bars, and has the table as their text equivalent', async () => {
    await distribution(STAGES);

    await expect.element(page.getByRole('table')).toBeVisible();
    // The chart is the table's picture: hidden from assistive technology, which has the table.
    const chart = document.querySelector('[data-slot="chart"]');
    expect(chart).not.toBeNull();
    expect(chart?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("draws each bar in its stage's colour, and puts the same colour beside the stage in the table", async () => {
    await distribution(STAGES);

    // The first open stage is blue and the last amber (the empty stage draws no bar).
    await expect
      .poll(() =>
        [...document.querySelectorAll('.recharts-bar-rectangle path')].map((bar) =>
          bar.getAttribute('fill'),
        ),
      )
      .toStrictEqual(['var(--status-blue)', 'var(--status-amber)']);
    const dots = page
      .getByRole('row')
      .elements()
      .slice(1)
      .map((row) => row.querySelector<HTMLElement>('[data-tone]')?.dataset.tone);
    expect(dots).toStrictEqual(['blue', 'violet', 'amber']);
  });

  it('writes the counts as numbers in the page language, in the table and on the bars', async () => {
    await distribution([{ stage: stage(1, 'Qualification'), count: 12_345, totals: [] }]);

    await expect.element(rowOf('Qualification')).toHaveTextContent('12,345');
    // The bar's own label, drawn once the bar is.
    await expect
      .poll(() => document.querySelector('[data-slot="chart"]')?.textContent)
      .toContain('12,345');
  });

  it('says so when there are no open stages', async () => {
    await distribution([]);

    await expect.element(page.getByText('No open stages.')).toBeVisible();
  });
});
