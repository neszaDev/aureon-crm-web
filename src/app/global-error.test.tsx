import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import GlobalError from './global-error';

describe(GlobalError, () => {
  it("draws the last-resort error in Aureon's world: the vermilion bar and one card", async () => {
    const retry = vi.fn<() => void>();
    // It is a whole document: React says <html> can't be inside the test's <div>, and draws it.
    await render(<GlobalError error={new Error('Boom')} retry={retry} />);

    const bar = page.getByRole('banner').element();
    expect(getComputedStyle(bar).backgroundColor).toBe('rgb(200, 54, 28)');
    await expect.element(page.getByRole('link', { name: 'Aureon CRM home' })).toBeVisible();
    const card = page.getByRole('alert').element();
    expect(getComputedStyle(card).backgroundColor).toBe('rgb(251, 251, 249)');
    expect(document.querySelector('.paper, [class*="text-ink-"], [class*="bg-folder"]')).toBeNull();

    await page.getByRole('button', { name: 'Try again' }).click();

    expect(retry).toHaveBeenCalledOnce();
  });
});
