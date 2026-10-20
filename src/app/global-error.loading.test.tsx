import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import GlobalError from './global-error';

// The content's chunk is on its way until the test lets it arrive.
const { arrival } = vi.hoisted(() => ({ arrival: Promise.withResolvers<boolean>() }));
vi.mock(import('@/components/GlobalErrorContent'), async (importOriginal) => {
  await arrival.promise;
  return await importOriginal();
});

describe(GlobalError, () => {
  it('draws the card with a reload while its content loads, never a blank page', async () => {
    // It is a whole document: React says <html> can't be inside the test's <div>, and draws it.
    await render(<GlobalError error={new Error('Boom')} retry={vi.fn<() => void>()} />);

    await expect
      .element(page.getByRole('alert').filter({ hasText: 'Une erreur est survenue' }))
      .toBeVisible();
    await expect.element(page.getByRole('button', { name: /^Reload/u })).toBeVisible();

    arrival.resolve(true);

    // Then the content, with its own retry.
    await expect.element(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});
