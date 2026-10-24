import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { signOut } from '@/actions/AuthActions';
import { Toaster } from '@/components/ui/sonner';
import type * as Navigation from '@/libs/I18nNavigation';
import messages from '@/locales/en.json';
import { AccountMenu } from './AccountMenu';

vi.mock(import('@/actions/AuthActions'), () => ({ signOut: vi.fn<typeof signOut>() }));
vi.mock(import('@/libs/I18nNavigation'), async (importOriginal) => ({
  ...(await importOriginal()),
  usePathname: vi.fn<typeof Navigation.usePathname>(() => '/app/1'),
  // @ts-expect-error -- the menu only changes the language with it
  useRouter: vi.fn<typeof Navigation.useRouter>(() => ({ replace: vi.fn<() => void>() })),
}));

describe(AccountMenu, () => {
  it('says why in a toast, and stays on the page, when signing out fails outright', async () => {
    vi.mocked(signOut).mockRejectedValue(new TypeError('Failed to fetch'));
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <AccountMenu userId={3} email="mia@acme.test" displayName="Mia Manager" workspaceId={1} />
        <Toaster />
      </NextIntlClientProvider>,
    );

    await page.getByRole('button', { name: 'Your account' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();

    expect(signOut).toHaveBeenCalledOnce();
    await expect
      .element(page.getByText("Couldn't reach the server. Check your connection and try again."))
      .toBeVisible();
  });
});
