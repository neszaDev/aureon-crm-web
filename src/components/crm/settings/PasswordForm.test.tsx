import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ActionResult } from '@/libs/api/ApiError';
import messages from '@/locales/en.json';
import type { PasswordChangeValues } from '@/validations/ProfileValidation';
import { PasswordForm } from './PasswordForm';

type Action = (values: PasswordChangeValues) => Promise<ActionResult>;

const fill = async (current: string, next: string) => {
  await page.getByLabelText('Current password').fill(current);
  await page.getByLabelText('New password', { exact: true }).fill(next);
  await page.getByLabelText('Confirm the new password').fill(next);
  await page.getByRole('button', { name: 'Change password' }).click();
};

describe(PasswordForm, () => {
  it('shows a server field error under its field and marks the field invalid', async () => {
    const action = vi.fn<Action>().mockResolvedValue({
      ok: false,
      fieldErrors: { currentPassword: "This isn't your current password" },
    });
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <PasswordForm action={action} />
      </NextIntlClientProvider>,
    );

    await page.getByLabelText('Current password').fill('wrong-password');
    await page.getByLabelText('New password', { exact: true }).fill('new-password-1');
    await page.getByLabelText('Confirm the new password').fill('new-password-1');
    await page.getByRole('button', { name: 'Change password' }).click();

    await expect.element(page.getByText("This isn't your current password")).toBeVisible();
    await expect
      .element(page.getByLabelText('Current password'))
      .toHaveAttribute('aria-invalid', 'true');
  });

  it('clears the fields once changed, and changes it again with the new values', async () => {
    const action = vi.fn<Action>().mockResolvedValue({ ok: true });
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <PasswordForm action={action} />
      </NextIntlClientProvider>,
    );
    await fill('first-password', 'second-password');
    await expect.element(page.getByText(/^Password changed/u)).toBeVisible();
    await expect.element(page.getByLabelText('Current password')).toHaveValue('');
    await fill('second-password', 'third-password');

    await expect.element(page.getByLabelText('Current password')).toHaveValue('');
    await vi.waitFor(() => {
      expect(action).toHaveBeenCalledTimes(2);
    });
    expect(action).toHaveBeenLastCalledWith({
      currentPassword: 'second-password',
      newPassword: 'third-password',
      confirmPassword: 'third-password',
    });
  });
});
