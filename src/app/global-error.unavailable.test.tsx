import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import GlobalError from './global-error';

// The content's chunk can't be had (offline, or a redeploy removed it): reaching it fails.
vi.mock(import('@/components/GlobalErrorContent'), () => ({
  get GlobalErrorContent(): never {
    throw new TypeError('Failed to fetch dynamically imported module');
  },
}));

describe(GlobalError, () => {
  it('draws a card with a reload when its content cannot load', async () => {
    // It is a whole document: React says <html> can't be inside the test's <div>, and draws it.
    await render(<GlobalError error={new Error('Boom')} retry={vi.fn<() => void>()} />);

    await expect
      .element(page.getByRole('alert').filter({ hasText: 'Une erreur est survenue' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('heading', { level: 1 }))
      .toHaveTextContent('Something went wrong');
    await expect.element(page.getByRole('button', { name: /^Reload/u })).toBeVisible();
  });
});
