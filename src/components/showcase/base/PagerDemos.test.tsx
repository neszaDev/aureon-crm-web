import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { PagerDemos } from './PagerDemos';

const withIntl = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    {ui}
  </NextIntlClientProvider>
);

const defaultBar = () => page.getByRole('navigation', { name: 'Default', exact: true });

describe(PagerDemos, () => {
  it('starts on page 3 in every bar', async () => {
    await render(withIntl(<PagerDemos />));

    await expect
      .element(defaultBar().getByRole('link', { name: 'Page 3' }))
      .toHaveAttribute('aria-current', 'page');
    await expect.element(page.getByText('Current page: 3').first()).toBeVisible();
  });

  it('moves every bar to the page clicked in one of them', async () => {
    await render(withIntl(<PagerDemos />));

    await page
      .getByRole('navigation', { name: 'Small' })
      .getByRole('link', { name: 'Page 4' })
      .click();

    await expect.element(page.getByText('Current page: 4').first()).toBeVisible();
    await expect
      .element(
        page
          .getByRole('navigation', { name: 'Centre alignment' })
          .getByRole('link', { name: 'Page 4' }),
      )
      .toHaveAttribute('aria-current', 'page');
  });

  it('shifts the window of pages and disables the end arrows on the last page', async () => {
    await render(withIntl(<PagerDemos />));

    await defaultBar().getByRole('link', { name: 'Last page' }).click();

    await expect.element(page.getByText('Current page: 10').first()).toBeVisible();
    await expect.element(defaultBar().getByRole('link', { name: 'Page 7' })).toBeVisible();
    await expect
      .element(defaultBar().getByRole('link', { name: 'Next page' }))
      .toHaveAttribute('aria-disabled', 'true');
  });
});
