import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ActionResult } from '@/libs/api/ApiError';
import type { components } from '@/libs/api/schema';
import messages from '@/locales/en.json';
import type { CompanyValues } from '@/validations/crm/CompanyValidation';
import { CompanyForm } from './CompanyForm';

type Action = (values: CompanyValues) => Promise<ActionResult>;
type FindDuplicates = (
  values: { name: string; website: string },
  excludeId?: number,
) => Promise<components['schemas']['CompanyRef'][]>;

const ME = 1;
const MEMBERS = [
  { userId: ME, email: 'mia@acme.test', displayName: 'Mia Manager' },
  { userId: 9, email: 'riley@acme.test', displayName: 'Riley Rep' },
];
const SAVED: CompanyValues = {
  name: 'Acme',
  industry: 'Retail',
  website: 'https://acme.test',
  phone: '',
  address: '',
  employeeCount: '120',
  ownerId: 9,
  notes: '',
};

const renderForm = async (props: {
  action: Action;
  canAssign?: boolean;
  findDuplicates?: FindDuplicates;
}) => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <CompanyForm
        action={props.action}
        findDuplicates={props.findDuplicates ?? vi.fn<FindDuplicates>().mockResolvedValue([])}
        defaults={SAVED}
        recordId={42}
        members={MEMBERS}
        me={ME}
        canAssign={props.canAssign ?? true}
        listPath="/app/1/companies"
        cancelHref="/app/1/companies/42"
        submitLabel="Save changes"
      />
    </NextIntlClientProvider>,
  );
};

describe(CompanyForm, () => {
  it('disables submit while the action is pending', async () => {
    const { promise, resolve } = Promise.withResolvers<ActionResult>();
    await renderForm({ action: vi.fn<Action>().mockReturnValue(promise) });
    const submit = page.getByRole('button', { name: 'Save changes' });

    await submit.click();

    await expect.element(submit).toBeDisabled();

    resolve({ ok: true });

    await expect.element(submit).toBeEnabled();
    await expect.element(page.getByText('Saved', { exact: true })).toBeVisible();
  });

  it('shows the website as it was saved, with its scheme', async () => {
    await renderForm({ action: vi.fn<Action>().mockResolvedValue({ ok: true }) });

    await page.getByLabelText('Website').fill(' acme.com ');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect.element(page.getByText('Saved', { exact: true })).toBeVisible();
    await expect.element(page.getByLabelText('Website')).toHaveValue('https://acme.com');
  });

  it("shows the backend's field error under its field", async () => {
    await renderForm({
      action: vi.fn<Action>().mockResolvedValue({
        ok: false,
        message: 'Check the highlighted fields and try again.',
        fieldErrors: { name: 'must not be blank' },
      }),
    });

    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect.element(page.getByText('must not be blank')).toBeVisible();
    await expect
      .element(page.getByLabelText('Company name'))
      .toHaveAccessibleDescription('must not be blank');
    await expect
      .element(page.getByLabelText('Company name'))
      .toHaveAttribute('aria-invalid', 'true');
  });

  it("shows the backend's refusal of the owner under the owner field", async () => {
    await renderForm({
      action: vi.fn<Action>().mockResolvedValue({
        ok: false,
        message: 'Check the highlighted fields and try again.',
        fieldErrors: { ownerId: 'is not a member of this workspace' },
      }),
    });

    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect
      .element(page.getByRole('combobox', { name: 'Owner' }))
      .toHaveAccessibleDescription('is not a member of this workspace');
  });

  it('offers a reload when someone else saved the company first', async () => {
    await renderForm({
      action: vi.fn<Action>().mockResolvedValue({
        ok: false,
        conflict: true,
        message: 'Someone else changed this. Reload to see their version.',
      }),
    });

    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect
      .element(page.getByText('Someone else changed this. Reload to see their version.'))
      .toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Reload' })).toBeVisible();
    expect(page.getByText('Saved', { exact: true }).elements()).toHaveLength(0);
  });

  it('shows the owner read-only without RECORDS_ASSIGN and still sends them', async () => {
    const action = vi.fn<Action>().mockResolvedValue({ ok: true });
    await renderForm({ action, canAssign: false });

    expect(page.getByRole('combobox', { name: 'Owner' }).elements()).toHaveLength(0);
    await expect.element(page.getByText('Riley Rep')).toBeVisible();

    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect.poll(() => action.mock.calls[0]?.[0].ownerId).toBe(9);
  });

  it('lists possible duplicates, other than this company, after the name loses focus', async () => {
    const findDuplicates = vi
      .fn<FindDuplicates>()
      .mockResolvedValue([{ id: 7, name: 'ACME', website: 'https://acme.test' }]);
    await renderForm({ action: vi.fn<Action>(), findDuplicates });

    await page.getByLabelText('Company name').fill('ACME');
    await page.getByLabelText('Industry').click();

    const link = page.getByRole('link', { name: /ACME/u });
    await expect.element(link).toHaveAttribute('href', '/app/1/companies/7');
    await expect.element(link).toHaveAttribute('target', '_blank');
    expect(findDuplicates).toHaveBeenCalledWith({ name: 'ACME', website: 'https://acme.test' }, 42);
  });

  it('sends what was typed since the last save, not the values saved before', async () => {
    const action = vi.fn<Action>().mockResolvedValue({ ok: true });
    await renderForm({ action });

    await page.getByLabelText('Company name').fill('Acme Ltd');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect.element(page.getByText('Saved', { exact: true })).toBeVisible();
    await page.getByLabelText('Company name').fill('Acme GmbH');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await vi.waitFor(() => {
      expect(action).toHaveBeenCalledTimes(2);
    });
    expect(action).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Acme GmbH' }));
  });
});
