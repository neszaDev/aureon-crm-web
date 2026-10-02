import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { TrafficCard } from './TrafficCard';

const withIntl = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    {ui}
  </NextIntlClientProvider>
);

describe(TrafficCard, () => {
  describe('Period toggle', () => {
    it('starts on the month and switches to the year', async () => {
      await render(withIntl(<TrafficCard />));

      const month = page.getByRole('radio', { name: 'Month' });
      const year = page.getByRole('radio', { name: 'Year' });

      await expect.element(month).toHaveAttribute('data-state', 'on');

      await year.click();

      await expect.element(year).toHaveAttribute('data-state', 'on');
      await expect.element(month).toHaveAttribute('data-state', 'off');
      await expect.element(page.getByText('2026', { exact: true })).toBeVisible();
    });

    it('keeps the current period when it is clicked again', async () => {
      await render(withIntl(<TrafficCard />));

      const month = page.getByRole('radio', { name: 'Month' });
      await month.click();

      await expect.element(month).toHaveAttribute('data-state', 'on');
    });
  });

  describe('Download', () => {
    it('saves the shown series as a CSV file named after the period', async () => {
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
      await render(withIntl(<TrafficCard />));

      await page.getByRole('radio', { name: 'Day' }).click();
      await page.getByRole('button', { name: 'Download the shown series as CSV' }).click();

      expect(click).toHaveBeenCalledOnce();
      expect(click.mock.contexts[0]).toHaveProperty('download', 'traffic-day.csv');

      click.mockRestore();
    });
  });

  describe('Totals', () => {
    it('shows each footer figure with its share', async () => {
      await render(withIntl(<TrafficCard />));

      await expect.element(page.getByText('29,703 users (40%)')).toBeVisible();
      await expect.element(page.getByText('Average rate (40.15%)')).toBeVisible();
      await expect
        .element(page.getByRole('progressbar', { name: 'New users' }))
        .toHaveAttribute('aria-valuenow', '80');
    });
  });
});
