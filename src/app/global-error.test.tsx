import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import GlobalError from './global-error';

describe(GlobalError, () => {
  it("draws the last-resort error in Aureon's world: the violet mark and one card", async () => {
    const retry = vi.fn<() => void>();
    // It is a whole document: React says <html> can't be inside the test's <div>, and draws it.
    await render(<GlobalError error={new Error('Boom')} retry={retry} />);

    // Its content loads when it shows.
    await expect.element(page.getByRole('banner')).toBeVisible();
    const home = page.getByRole('banner').getByRole('link', { name: 'Aureon CRM home' });
    await expect.element(home).toBeVisible();
    const mark = home.element().querySelector('[data-slot="aureon-mark"]');
    expect(mark && getComputedStyle(mark).color).toBe('rgb(90, 69, 224)');
    const card = page.getByRole('alert').element();
    expect(getComputedStyle(card).backgroundColor).toBe('rgb(255, 255, 255)');
    expect(document.querySelector('.paper, [class*="text-ink-"], [class*="bg-folder"]')).toBeNull();

    await page.getByRole('button', { name: 'Try again' }).click();

    expect(retry).toHaveBeenCalledOnce();
  });
});
