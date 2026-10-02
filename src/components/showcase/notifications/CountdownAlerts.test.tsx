import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { CountdownAlerts } from './CountdownAlerts';
import { DismissibleAlerts } from './DismissibleAlerts';

const withIntl = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    {ui}
  </NextIntlClientProvider>
);

describe(CountdownAlerts, () => {
  it('counts down and dismisses both alerts at zero', async () => {
    await render(withIntl(<CountdownAlerts seconds={2} />));

    await expect
      .poll(() => page.getByText('This alert closes in 2 seconds…').elements())
      .toHaveLength(2);
    await expect.element(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    await expect
      .poll(() => page.getByText('This alert closes in 1 second…').elements())
      .toHaveLength(2);
    await expect.element(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    await expect.element(page.getByRole('progressbar'), { timeout: 3000 }).not.toBeInTheDocument();
  });

  it('stops when closed and starts again from the button', async () => {
    await render(withIntl(<CountdownAlerts seconds={5} />));

    await page.getByRole('button', { name: 'Close' }).first().click();

    await expect.element(page.getByRole('progressbar')).not.toBeInTheDocument();

    await page.getByRole('button', { name: 'Show alerts with timer' }).click();

    await expect
      .poll(() => page.getByText('This alert closes in 5 seconds…').elements())
      .toHaveLength(2);
  });
});

describe(DismissibleAlerts, () => {
  it('dismisses each alert and brings both back', async () => {
    await render(withIntl(<DismissibleAlerts />));

    await page.getByRole('button', { name: 'Close' }).first().click();
    await page.getByRole('button', { name: 'Close' }).click();

    await expect.element(page.getByText('Dismissible alert.')).not.toBeInTheDocument();
    await expect
      .element(page.getByText('Dismissible alert with a custom button.'))
      .not.toBeInTheDocument();

    await page.getByRole('button', { name: 'Show dismissible alerts' }).click();

    await expect.element(page.getByText('Dismissible alert.')).toBeVisible();
    await expect.element(page.getByText('Dismissible alert with a custom button.')).toBeVisible();
  });
});
