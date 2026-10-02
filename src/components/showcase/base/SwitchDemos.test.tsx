import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { DefaultSwitches, RadioSwitches } from './SwitchDemos';

const withIntl = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    {ui}
  </NextIntlClientProvider>
);

describe(RadioSwitches, () => {
  it('starts with the pencil switch on and names it in the badge', async () => {
    await render(withIntl(<RadioSwitches />));

    await expect.element(page.getByRole('radio', { name: 'Graphite pencil' })).toBeChecked();
    await expect.element(page.getByText('Graphite pencil', { exact: true }).first()).toBeVisible();
  });

  it('turns the others off when another switch is turned on', async () => {
    await render(withIntl(<RadioSwitches />));

    await page.getByRole('radio', { name: 'Pass green' }).click();

    await expect.element(page.getByRole('radio', { name: 'Pass green' })).toBeChecked();
    await expect.element(page.getByRole('radio', { name: 'Graphite pencil' })).not.toBeChecked();
    expect(page.getByRole('radio', { checked: true }).elements()).toHaveLength(1);
  });

  it('keeps the chosen switch on when it is clicked again', async () => {
    await render(withIntl(<RadioSwitches />));

    await page.getByRole('radio', { name: 'Graphite pencil' }).click();

    await expect.element(page.getByRole('radio', { name: 'Graphite pencil' })).toBeChecked();
  });
});

describe(DefaultSwitches, () => {
  it('shows the first switch state in the badge', async () => {
    await render(withIntl(<DefaultSwitches />));

    await expect.element(page.getByText('On', { exact: true })).toBeVisible();

    await page.getByRole('switch', { name: 'Folder green' }).click();

    await expect.element(page.getByText('Off', { exact: true })).toBeVisible();
    await expect.element(page.getByRole('switch', { name: 'Disabled switch' })).toBeDisabled();
  });
});
