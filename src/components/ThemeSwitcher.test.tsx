import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { chooseTheme } from '@/libs/Theme';
import messages from '@/locales/en.json';
import { ThemeSwitcher } from './ThemeSwitcher';

describe(ThemeSwitcher, () => {
  afterEach(() => {
    chooseTheme('system');
  });

  it('switches the theme in the browser and remembers it in the theme cookie', async () => {
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <ThemeSwitcher theme="system" />
      </NextIntlClientProvider>,
    );

    await page.getByRole('radio', { name: 'Dark' }).click();

    await expect.element(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
    await expect.element(document.documentElement).toHaveClass('dark');
    expect(document.cookie).toContain('theme=dark');

    await page.getByRole('radio', { name: 'System' }).click();

    await expect.element(document.documentElement).not.toHaveClass('dark');
    expect(document.cookie).toContain('theme=system');
  });
});
