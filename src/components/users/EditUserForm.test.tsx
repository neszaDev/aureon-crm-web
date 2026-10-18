import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { updateUser } from '@/actions/UserActions';
import messages from '@/locales/en.json';
import { EditUserForm } from './EditUserForm';

vi.mock(import('@/actions/UserActions'), () => ({
  updateUser: vi.fn<typeof updateUser>().mockResolvedValue({ ok: true }),
}));

describe(EditUserForm, () => {
  it('sends what was typed since the last save, not the values saved before', async () => {
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <EditUserForm id={5} defaults={{ email: 'ana@acme.test', role: 'USER' }} />
      </NextIntlClientProvider>,
    );

    await page.getByLabelText('Email address').fill('ana.lima@acme.test');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect.element(page.getByText('Saved', { exact: true })).toBeVisible();
    await page.getByLabelText('Email address').fill('ana.costa@acme.test');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await vi.waitFor(() => {
      expect(updateUser).toHaveBeenCalledTimes(2);
    });
    expect(updateUser).toHaveBeenLastCalledWith(5, { email: 'ana.costa@acme.test', role: 'USER' });

    await expect.element(page.getByText('Saved', { exact: true })).toBeVisible();
    await page.getByLabelText('Role').selectOptions('ADMIN');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await vi.waitFor(() => {
      expect(updateUser).toHaveBeenCalledTimes(3);
    });
    expect(updateUser).toHaveBeenLastCalledWith(5, { email: 'ana.costa@acme.test', role: 'ADMIN' });
  });
});
