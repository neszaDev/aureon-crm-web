import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { WidgetsBrand } from './WidgetsBrand';
import { WidgetsDropdown } from './WidgetsDropdown';

const withIntl = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    {ui}
  </NextIntlClientProvider>
);

describe(WidgetsDropdown, () => {
  it('opens a widget menu with a disabled last action', async () => {
    await render(withIntl(<WidgetsDropdown />));

    await expect.element(page.getByText('9,823').first()).toBeVisible();

    await page.getByRole('button', { name: 'Widget options' }).first().click();

    await expect.element(page.getByRole('menuitem', { name: 'Another action' })).toBeVisible();
    await expect
      .element(page.getByRole('menuitem', { name: 'Disabled action' }))
      .toHaveAttribute('aria-disabled', 'true');
  });
});

describe(WidgetsBrand, () => {
  it('names each logo and prints compact and open-ended figures', async () => {
    await render(withIntl(<WidgetsBrand />));

    await expect.element(page.getByText('Facebook')).toBeInTheDocument();
    await expect.element(page.getByText('89K')).toBeVisible();
    await expect.element(page.getByText('500+')).toBeVisible();
    await expect.element(page.getByText('Contacts')).toBeVisible();
  });
});
