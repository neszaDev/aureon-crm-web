import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { Toaster } from '@/components/ui/sonner';
import { toastActionFailure } from './ActionToast';

describe(toastActionFailure, () => {
  it('offers a reload when someone changed the record first', async () => {
    await render(<Toaster />);

    toastActionFailure(
      { ok: false, message: "This task's status changed meanwhile.", conflict: true },
      'Try again.',
      'Reload',
    );

    await expect.element(page.getByText("This task's status changed meanwhile.")).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Reload' })).toBeVisible();
  });

  it('says what went wrong without a reload, or the fallback without a message', async () => {
    await render(<Toaster />);

    toastActionFailure({ ok: false }, 'That did not work.', 'Reload');

    await expect.element(page.getByText('That did not work.')).toBeVisible();
    // Another test's toast may still be on screen: look inside this one.
    const toast = page.getByRole('listitem').filter({ hasText: 'That did not work.' });
    expect(toast.getByRole('button').elements()).toHaveLength(0);
  });
});
