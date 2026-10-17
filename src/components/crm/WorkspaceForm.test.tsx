import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ActionResult } from '@/libs/api/ApiError';
import messages from '@/locales/en.json';
import type { WorkspaceValues } from '@/validations/crm/WorkspaceValidation';
import { WorkspaceForm } from './WorkspaceForm';

const CURRENCIES = [
  { value: 'EUR', label: 'EUR · Euro' },
  { value: 'USD', label: 'USD · US dollar' },
];
const browserZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
const TIME_ZONES = [...new Set(['Europe/Paris', 'UTC', browserZone])];

type Action = (values: WorkspaceValues) => Promise<ActionResult>;

const renderForm = async (action: Action) => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <WorkspaceForm action={action} currencies={CURRENCIES} timeZones={TIME_ZONES} />
    </NextIntlClientProvider>,
  );
};

describe(WorkspaceForm, () => {
  it('starts with USD and the browser time zone', async () => {
    await renderForm(vi.fn<Action>());

    await expect.element(page.getByLabelText('Default currency')).toHaveValue('USD');
    await expect.element(page.getByLabelText('Time zone')).toHaveValue(browserZone);
  });

  it('asks for a name before calling the action', async () => {
    const action = vi.fn<Action>();
    await renderForm(action);

    await page.getByLabelText('Workspace name').fill('   ');
    await page.getByRole('button', { name: 'Create workspace' }).click();

    await expect.element(page.getByText('Required')).toBeVisible();
    expect(action).not.toHaveBeenCalled();
  });

  it('disables submit while the action is pending and sends trimmed values', async () => {
    const { promise, resolve } = Promise.withResolvers<ActionResult>();
    const action = vi.fn<Action>().mockReturnValue(promise);
    await renderForm(action);
    const submit = page.getByRole('button', { name: 'Create workspace' });

    await page.getByLabelText('Workspace name').fill('  Acme  ');
    await page.getByLabelText('Default currency').selectOptions('EUR');
    await page.getByLabelText('Time zone').selectOptions('Europe/Paris');
    await submit.click();

    await expect.element(submit).toBeDisabled();
    expect(action).toHaveBeenCalledWith({
      name: 'Acme',
      defaultCurrency: 'EUR',
      timezone: 'Europe/Paris',
    });

    resolve({ ok: false, message: 'Try again' });

    await expect.element(submit).toBeEnabled();
  });

  it('shows the backend field errors under their fields and its message above', async () => {
    await renderForm(
      vi.fn<Action>().mockResolvedValue({
        ok: false,
        message: 'Validation failed',
        fieldErrors: { name: 'Name is already used', timezone: 'is not an IANA time zone' },
      }),
    );

    await page.getByLabelText('Workspace name').fill('Acme');
    await page.getByRole('button', { name: 'Create workspace' }).click();

    await expect.element(page.getByText('Validation failed')).toBeVisible();
    await expect.element(page.getByText('Name is already used')).toBeVisible();
    await expect.element(page.getByText('is not an IANA time zone')).toBeVisible();
    await expect
      .element(page.getByLabelText('Workspace name'))
      .toHaveAttribute('aria-invalid', 'true');
  });
});
