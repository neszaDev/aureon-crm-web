import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { TogglePressedDemo } from './TogglePressedDemo';

describe(TogglePressedDemo, () => {
  it('presses every toggle when one is pressed, and releases them together', async () => {
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <TogglePressedDemo />
      </NextIntlClientProvider>,
    );
    const toggles = page.getByRole('button');

    await expect.poll(() => toggles.elements()).toHaveLength(6);

    await page.getByRole('button', { name: 'Outline, small: Off' }).click();

    await expect
      .poll(() => toggles.elements().map((toggle) => toggle.getAttribute('aria-pressed')))
      .toEqual(Array.from({ length: 6 }, () => 'true'));
    await expect.element(page.getByRole('button', { name: 'Plain, large: On' })).toBeVisible();

    await page.getByRole('button', { name: 'Plain, large: On' }).click();

    await expect
      .poll(() => toggles.elements().map((toggle) => toggle.getAttribute('aria-pressed')))
      .toEqual(Array.from({ length: 6 }, () => 'false'));
  });
});
