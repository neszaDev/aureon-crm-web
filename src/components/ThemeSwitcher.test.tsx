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

  it("tints the browser's bar with the ground of the theme shown, the OS's for system", async () => {
    // The root layout's two tags, one per OS scheme.
    const tags = (['light', 'dark'] as const).map((scheme) => {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.media = `(prefers-color-scheme: ${scheme})`;
      meta.content = scheme === 'light' ? '#eff0ec' : '#141212';
      document.head.append(meta);
      return meta;
    });
    try {
      await render(
        <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
          <ThemeSwitcher theme="system" />
        </NextIntlClientProvider>,
      );

      await page.getByRole('radio', { name: 'Dark' }).click();
      await expect
        .poll(() => tags.map((meta) => meta.content))
        .toStrictEqual(['#141212', '#141212']);

      await page.getByRole('radio', { name: 'Light' }).click();
      await expect
        .poll(() => tags.map((meta) => meta.content))
        .toStrictEqual(['#eff0ec', '#eff0ec']);

      await page.getByRole('radio', { name: 'System' }).click();
      await expect
        .poll(() => tags.map((meta) => meta.content))
        .toStrictEqual(['#eff0ec', '#141212']);
    } finally {
      for (const meta of tags) {
        meta.remove();
      }
    }
  });
});
