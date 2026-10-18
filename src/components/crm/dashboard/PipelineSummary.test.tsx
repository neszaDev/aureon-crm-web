import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import en from '@/locales/en.json';
import { PipelineSummary } from './PipelineSummary';

type Props = Parameters<typeof PipelineSummary>[0];

const summary = async (totals: Props['totals']) =>
  await render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <PipelineSummary totals={totals} />
    </NextIntlClientProvider>,
  );

describe(PipelineSummary, () => {
  it('shows each currency its open and weighted amounts exactly as sent, never added across', async () => {
    await summary([
      { currency: 'EUR', amount: '42000.00', weightedAmount: '13075.00' },
      { currency: 'USD', amount: '199500.00', weightedAmount: '89625.00' },
    ]);

    const currencies = page
      .getByRole('listitem')
      .elements()
      .map((item) => [
        item.querySelector('h3')?.textContent,
        ...[...item.querySelectorAll('dt, dd')].map((cell) => cell.textContent),
      ]);
    expect(currencies).toStrictEqual([
      ['EUR', 'Open', '€42,000.00', 'Weighted', '€13,075.00'],
      ['USD', 'Open', '$199,500.00', 'Weighted', '$89,625.00'],
    ]);
    expect(document.body.textContent).not.toContain('241,500');
    await expect
      .element(page.getByText('Totals are kept per currency and never added together.'))
      .toBeVisible();
  });

  it('needs no remark about currencies for one', async () => {
    await summary([{ currency: 'THB', amount: '1250.50', weightedAmount: '625.25' }]);

    await expect.element(page.getByText(/1,250\.50/u)).toBeVisible();
    expect(page.getByText('never added together').elements()).toHaveLength(0);
  });

  it('says when nothing is open', async () => {
    await summary([]);

    await expect.element(page.getByText('No open deals.')).toBeVisible();
    expect(page.getByRole('listitem').elements()).toHaveLength(0);
  });
});
