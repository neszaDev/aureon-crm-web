import { NextIntlClientProvider } from 'next-intl';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ActionResult } from '@/libs/api/ApiError';
import messages from '@/locales/en.json';
import type { LeadValues } from '@/validations/crm/LeadValidation';
import { LeadForm } from './LeadForm';

type Action = (values: LeadValues) => Promise<ActionResult>;

const ME = 1;
const SAVED: LeadValues = {
  firstName: 'Mia',
  lastName: 'Chan',
  companyName: 'Acme',
  email: 'mia@acme.test',
  phone: '',
  jobTitle: '',
  sourceId: null,
  ownerId: ME,
  priority: 'HIGH',
  followUpDate: '',
  estimatedValue: '1250.00',
  currency: 'EUR',
  notes: '',
};

const form = (props: { action: Action; defaults?: LeadValues }) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <LeadForm
      action={props.action}
      defaults={props.defaults ?? SAVED}
      isEdit
      members={[{ userId: ME, email: 'mia@acme.test', displayName: 'Mia Manager' }]}
      me={ME}
      canAssign
      sources={[]}
      defaultCurrency="EUR"
      currencies={[
        { value: 'EUR', label: 'EUR · Euro' },
        { value: 'USD', label: 'USD · US dollar' },
      ]}
      timeZone="UTC"
      cancelHref="/app/1/leads/42"
      submitLabel="Save changes"
    />
  </NextIntlClientProvider>
);

describe(LeadForm, () => {
  it('sends neither value nor currency when the estimated value is cleared', async () => {
    const action = vi.fn<Action>().mockResolvedValue({ ok: true });
    await render(form({ action }));

    await page.getByRole('button', { name: 'Estimated value: 1250.00 EUR' }).click();
    await page.getByLabelText('Estimated value').fill('');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect.element(page.getByText('Saved', { exact: true })).toBeVisible();
    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({ estimatedValue: '', currency: '' }),
    );
    // Its chip is empty again, and so is the currency in it.
    await page.getByRole('button', { name: 'Estimated value', exact: true }).click();
    await expect.element(page.getByLabelText('Currency')).toHaveValue('');
  });

  it("marks the field invalid and shows the backend's error under it", async () => {
    const action = vi.fn<Action>().mockResolvedValue({
      ok: false,
      message: 'Check the highlighted fields and try again.',
      fieldErrors: { firstName: 'must not be blank' },
    });
    await render(form({ action }));

    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect
      .element(page.getByLabelText('First name'))
      .toHaveAccessibleDescription('must not be blank');
    await expect.element(page.getByLabelText('First name')).toHaveAttribute('aria-invalid', 'true');
  });

  it('server-renders the saved priority and value with its currency in their chips', () => {
    const html = renderToString(
      form({ action: vi.fn<Action>(), defaults: { ...SAVED, currency: 'USD' } }),
    );
    const chip = (id: string) =>
      new DOMParser().parseFromString(html, 'text/html').querySelector(`#${id}`)?.textContent;

    expect(chip('lead-priority-chip')).toBe('Priority: High');
    expect(chip('lead-value-chip')).toBe('Estimated value: 1250.00 USD');
  });

  it('sends what was typed since the last save, not the values saved before', async () => {
    const action = vi.fn<Action>().mockResolvedValue({ ok: true });
    await render(form({ action }));

    await page.getByLabelText('First name').fill('Mina');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect.element(page.getByText('Saved', { exact: true })).toBeVisible();
    await page.getByLabelText('First name').fill('Mira');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await vi.waitFor(() => {
      expect(action).toHaveBeenCalledTimes(2);
    });
    expect(action).toHaveBeenLastCalledWith(expect.objectContaining({ firstName: 'Mira' }));
  });
});
