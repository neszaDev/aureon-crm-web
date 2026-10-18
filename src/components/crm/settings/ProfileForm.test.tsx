import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ActionResult } from '@/libs/api/ApiError';
import messages from '@/locales/en.json';
import type { ProfileValues } from '@/validations/ProfileValidation';
import { ProfileForm } from './ProfileForm';

type Action = (values: ProfileValues) => Promise<ActionResult>;

describe(ProfileForm, () => {
  it('sends what was typed since the last save, not the name saved before', async () => {
    const action = vi.fn<Action>().mockResolvedValue({ ok: true });
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <ProfileForm email="mia@acme.test" displayName="Mia" action={action} />
      </NextIntlClientProvider>,
    );

    await page.getByLabelText('Display name').fill('Mia Chan');
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect.element(page.getByText('Saved', { exact: true })).toBeVisible();
    await page.getByLabelText('Display name').fill('Mia Manager');
    await page.getByRole('button', { name: 'Save profile' }).click();

    await vi.waitFor(() => {
      expect(action).toHaveBeenCalledTimes(2);
    });
    expect(action).toHaveBeenLastCalledWith({ displayName: 'Mia Manager' });

    await expect.element(page.getByText('Saved', { exact: true })).toBeVisible();
    await page.getByLabelText('Display name').fill('Mia M.');
    await page.getByRole('button', { name: 'Save profile' }).click();

    await vi.waitFor(() => {
      expect(action).toHaveBeenCalledTimes(3);
    });
    expect(action).toHaveBeenLastCalledWith({ displayName: 'Mia M.' });
  });
});
