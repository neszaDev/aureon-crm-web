import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
// What the page looks like is what is tested: the real styles are needed.
import '@/styles/global.css';
import ErrorPage from './error';

describe(ErrorPage, () => {
  it("draws a public page's error in Aureon's world: the vermilion bar and one card", async () => {
    const retry = vi.fn<() => void>();
    // Only what the root layout gives the public pages' client components.
    await render(
      <NextIntlClientProvider
        locale="en"
        messages={{ ErrorPage: messages.ErrorPage, Brand: messages.Brand }}
        timeZone="UTC"
      >
        <ErrorPage error={new Error('Boom')} retry={retry} />
      </NextIntlClientProvider>,
    );

    const bar = page.getByRole('banner').element();
    expect(getComputedStyle(bar).backgroundColor).toBe('rgb(200, 54, 28)');
    await expect.element(page.getByRole('link', { name: 'Aureon CRM home' })).toBeVisible();
    const card = page.getByRole('alert').element();
    // Bond paper with the hairline, never the demos' Marksheet card.
    expect(getComputedStyle(card).backgroundColor).toBe('rgb(251, 251, 249)');
    expect(document.querySelector('.paper, [class*="text-ink-"], [class*="bg-folder"]')).toBeNull();
    await expect
      .element(page.getByRole('heading', { level: 1, name: 'Something went wrong' }))
      .toBeVisible();

    await page.getByRole('button', { name: 'Try again' }).click();

    expect(retry).toHaveBeenCalledOnce();
    await expect
      .element(page.getByRole('link', { name: 'Back to home' }))
      .toHaveAttribute('href', '/');
  });
});
