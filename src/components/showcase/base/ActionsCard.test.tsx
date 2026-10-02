import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { ActionsCard } from './ActionsCard';

const withIntl = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    {ui}
  </NextIntlClientProvider>
);

describe(ActionsCard, () => {
  it('folds and unfolds the body with the minimise button', async () => {
    await render(withIntl(<ActionsCard>Card body</ActionsCard>));

    await expect.element(page.getByText('Card body')).toBeVisible();

    await page.getByRole('button', { name: 'Fold the card body' }).click();

    await expect.element(page.getByText('Card body')).not.toBeInTheDocument();
    await expect
      .element(page.getByRole('button', { name: 'Unfold the card body' }))
      .toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the card and brings it back', async () => {
    await render(withIntl(<ActionsCard>Card body</ActionsCard>));

    await page.getByRole('button', { name: 'Close the card' }).click();

    await expect.element(page.getByText('Card with header actions')).not.toBeInTheDocument();

    await page.getByRole('button', { name: 'Show the card again' }).click();

    await expect.element(page.getByText('Card body')).toBeVisible();
  });
});
