import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import en from '@/locales/en.json';
import { WonLostSummary } from './WonLostSummary';

type Props = Parameters<typeof WonLostSummary>[0];

const summary = async (props: Props) =>
  await render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <WonLostSummary {...props} />
    </NextIntlClientProvider>,
  );

describe(WonLostSummary, () => {
  it('shows the period counts and the won totals per currency as sent', async () => {
    await summary({
      won: {
        count: 3,
        totals: [
          { currency: 'EUR', amount: '9000.00' },
          { currency: 'USD', amount: '35000.00' },
        ],
      },
      lost: { count: 1 },
    });

    await expect.element(page.getByRole('term').first()).toHaveTextContent('Won');
    const won = page.getByRole('definition').first();
    await expect.element(won).toHaveTextContent('3 deals');
    // One figure for each currency, with its code.
    const totals = won.getByRole('listitem').elements();
    expect(totals.map((item) => item.textContent)).toStrictEqual(['€9,000.00', '$35,000.00']);
    await expect.element(page.getByRole('definition').nth(1)).toHaveTextContent('1 deal');
    expect(document.body.textContent).not.toContain('44,000');
  });

  it('says so when nothing was won, and still counts the lost deals', async () => {
    await summary({ won: { count: 0, totals: [] }, lost: { count: 2 } });

    await expect.element(page.getByText('No deals won in this period.')).toBeVisible();
    await expect.element(page.getByRole('definition').nth(1)).toHaveTextContent('2 deals');
  });

  it('says that only these follow the period', async () => {
    await summary({ won: { count: 0, totals: [] }, lost: { count: 0 } });

    await expect
      .element(
        page.getByText('Won and lost follow the period; the rest of this page is as of now.'),
      )
      .toBeVisible();
  });
});
