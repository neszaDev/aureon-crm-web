import { NextIntlClientProvider } from 'next-intl';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { ToasterDemo } from './ToasterDemo';

const withIntl = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    {ui}
  </NextIntlClientProvider>
);

describe(ToasterDemo, () => {
  // Sonner keeps toasts in a module-level store, so a floating toast from one test would
  // otherwise cover the next test's controls.
  afterEach(async () => {
    toast.dismiss();
    await vi.waitFor(() => {
      if (document.querySelector('[data-sonner-toast]')) {
        throw new Error('A toast is still on screen');
      }
    });
  });

  it('starts with two static toasts and adds a numbered third', async () => {
    await render(withIntl(<ToasterDemo />));
    const staticList = page.getByRole('region', { name: 'Static toasts' }).getByRole('listitem');

    await expect.poll(() => staticList.elements()).toHaveLength(2);

    await page.getByLabelText('Position').selectOptions('static');
    await page.getByRole('button', { name: 'Add toast' }).click();

    await expect
      .element(page.getByText('This is toast number 3 in the “Static (in the page)” position.'))
      .toBeVisible();
  });

  it('floats a toast with the chosen title and body', async () => {
    await render(withIntl(<ToasterDemo />));

    await page.getByRole('checkbox', { name: 'Hide automatically' }).click();
    await page.getByLabelText('Title').fill('Marks saved');
    await page.getByLabelText('Body').fill('Twelve results were updated.');
    await page.getByRole('button', { name: 'Add toast' }).click();

    const floating = page.getByRole('listitem').filter({ hasText: 'Marks saved' });

    await expect.element(floating).toBeInTheDocument();
    await expect.element(floating.getByText('Twelve results were updated.')).toBeInTheDocument();
  });

  it('hides the delay field when autohide is off', async () => {
    await render(withIntl(<ToasterDemo />));

    await page.getByRole('checkbox', { name: 'Hide automatically' }).click();

    await expect.element(page.getByLabelText('Time before hiding (ms)')).not.toBeInTheDocument();
  });

  it('closes a static toast from its close button', async () => {
    await render(withIntl(<ToasterDemo />));
    const staticToasts = page.getByRole('region', { name: 'Static toasts' });

    await staticToasts.getByRole('button', { name: 'Close' }).first().click();

    await expect.poll(() => staticToasts.getByRole('listitem').elements()).toHaveLength(1);
  });
});
