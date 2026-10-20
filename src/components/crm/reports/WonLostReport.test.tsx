import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import { WonLostReport } from './WonLostReport';

type Props = Parameters<typeof WonLostReport>[0];

// A fixed response: August to October 2026, September without a single deal, and August with
// won deals in two currencies.
const REPORT: Props['report'] = {
  period: { from: '2026-08-10', to: '2026-10-18' },
  months: [
    {
      month: '2026-08',
      won: 3,
      lost: 1,
      wonTotals: [
        { currency: 'EUR', amount: '12000.00' },
        { currency: 'USD', amount: '35000.50' },
      ],
    },
    { month: '2026-09', won: 0, lost: 0, wonTotals: [] },
    { month: '2026-10', won: 2, lost: 4, wonTotals: [{ currency: 'USD', amount: '8000.00' }] },
  ],
};

const report = async (value: Props['report'], locale: 'en' | 'fr' = 'en') =>
  await render(
    <NextIntlClientProvider locale={locale} messages={locale === 'fr' ? fr : en} timeZone="UTC">
      <WonLostReport report={value} />
    </NextIntlClientProvider>,
  );

const rowsOf = () =>
  page
    .getByRole('row')
    .elements()
    .slice(1)
    .map((row) => [...row.children].map((cell) => cell.textContent));

describe(WonLostReport, () => {
  it('lists every month of the period, oldest first, the one without deals too', async () => {
    await report(REPORT);

    expect(rowsOf().map((row) => row[0])).toStrictEqual(['Aug 2026', 'Sep 2026', 'Oct 2026']);
    expect(rowsOf()[1]).toStrictEqual(['Sep 2026', '0', '0', 'None']);
  });

  it('shows the counts as sent and each currency of the won totals on its own line, never added', async () => {
    await report(REPORT);

    expect(rowsOf()[0]).toStrictEqual(['Aug 2026', '3', '1', '€12,000.00$35,000.50']);
    expect(rowsOf()[2]).toStrictEqual(['Oct 2026', '2', '4', '$8,000.00']);
    const cells = page
      .getByRole('row', { name: /Aug 2026/u })
      .getByRole('listitem')
      .elements();
    expect(cells.map((cell) => cell.textContent)).toStrictEqual(['€12,000.00', '$35,000.50']);
    // No sum of the two currencies, nor of the months' USD, anywhere.
    const text = document.body.textContent;
    expect(text).not.toContain('47,000');
    expect(text).not.toContain('43,000');
  });

  it('names the months in the page language', async () => {
    await report(REPORT, 'fr');

    expect(rowsOf().map((row) => row[0])).toStrictEqual(['août 2026', 'sept. 2026', 'oct. 2026']);
  });

  it('draws grouped bars for won and lost with a pattern for lost, hidden from assistive technology', async () => {
    await report(REPORT);

    const chart = document.querySelector('[data-slot="chart"]');
    expect(chart?.closest('[aria-hidden="true"]')).not.toBeNull();
    // Drawn once the chart has its size: a bar for each count above zero (September has none), a
    // hatch that tells lost from won when the colours cannot, and the legend naming both.
    await expect.poll(() => chart?.querySelectorAll('.recharts-bar-rectangle').length).toBe(4);
    expect(chart?.querySelector('pattern')).not.toBeNull();
    await expect.poll(() => chart?.querySelectorAll('[fill^="url(#lost-"]').length).toBe(2);
    expect(chart?.parentElement?.textContent).toContain('Won');
    expect(chart?.parentElement?.textContent).toContain('Lost');
  });

  it('writes the counts on the bars, as sent', async () => {
    await report(REPORT);

    const chart = document.querySelector('[data-slot="chart"]');
    await expect
      .poll(() =>
        [...(chart?.querySelectorAll('text.fill-foreground') ?? [])].map(
          (text) => text.textContent,
        ),
      )
      .toStrictEqual(['3', '2', '1', '4']);
  });

  it('leaves the numbers off the bars past six months, where they would crowd; the table has them', async () => {
    const months = Array.from({ length: 8 }, (_, index) => ({
      month: `2026-${String(index + 1).padStart(2, '0')}`,
      won: index + 1,
      lost: 1,
      wonTotals: [],
    }));
    await report({ period: { from: '2026-01-01', to: '2026-08-31' }, months });

    const chart = document.querySelector('[data-slot="chart"]');
    await expect.poll(() => chart?.querySelectorAll('.recharts-bar-rectangle').length).toBe(16);
    expect(chart?.querySelectorAll('text.fill-foreground')).toHaveLength(0);
    expect(rowsOf()).toHaveLength(8);
  });

  it('keeps the table as the text of the chart', async () => {
    await report(REPORT);

    await expect.element(page.getByRole('table')).toBeVisible();
    await expect.element(page.getByRole('columnheader', { name: 'Won value' })).toBeVisible();
  });
});
