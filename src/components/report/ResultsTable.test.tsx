import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { ResultsTable } from './ResultsTable';
import { TotalsStrip } from './TotalsStrip';

const withIntl = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    {ui}
  </NextIntlClientProvider>
);

describe(ResultsTable, () => {
  describe('With rows', () => {
    it('renders each result with its status, score and note', async () => {
      await render(
        withIntl(
          <ResultsTable
            rows={[
              {
                id: 1,
                testName: 'Spanish mock exam',
                status: 'FAILED',
                score: 58,
                testedAt: '2026-09-24T14:00:00Z',
                notes: 'Retake the listening part',
              },
            ]}
          />,
        ),
      );

      const row = page.getByRole('row', { name: /Spanish mock exam/u });

      await expect.element(row).toBeVisible();
      await expect.element(row.getByText('Failed')).toBeVisible();
      await expect.element(row.getByText('58')).toBeVisible();
      await expect.element(row.getByText('Retake the listening part')).toBeVisible();
    });
  });

  describe('Without rows', () => {
    it('shows the empty card instead of rows', async () => {
      await render(withIntl(<ResultsTable rows={[]} empty={<p>Nothing on the card</p>} />));

      await expect.element(page.getByText('Nothing on the card')).toBeVisible();
    });
  });
});

describe(TotalsStrip, () => {
  it('shows every mark, with zero for statuses the summary leaves out', async () => {
    await render(
      withIntl(
        <TotalsStrip testIds summary={{ total: 3, byStatus: [{ status: 'PASSED', count: 3 }] }} />,
      ),
    );

    await expect.element(page.getByTestId('summary-PASSED')).toHaveTextContent('3');
    await expect.element(page.getByTestId('summary-FAILED')).toHaveTextContent('0');
    await expect.element(page.getByTestId('summary-PENDING')).toHaveTextContent('0');
  });

  // A page's streamed copy can stay in the DOM, hidden, after a quick client navigation (React's
  // late Suspense swap finds its boundary gone): a second strip with the same ids there made
  // `getByTestId('summary-PASSED')` ambiguous on the next page. Only the page under test has them.
  it('carries no test ids unless the page asks for them', async () => {
    await render(withIntl(<TotalsStrip summary={{ total: 1 }} />));

    await expect.element(page.getByText('Passed')).toBeVisible();
    expect(document.querySelector('[data-testid^="summary-"]')).toBeNull();
  });
});
