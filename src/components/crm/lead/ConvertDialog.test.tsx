import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { ConvertResult } from '@/actions/crm/LeadActions';
import { convertLead } from '@/actions/crm/LeadActions';
import { searchRecords } from '@/actions/crm/RecordSearchActions';
import type { components } from '@/libs/api/schema';
import messages from '@/locales/en.json';
import { ConvertDialog } from './ConvertDialog';

type Lead = components['schemas']['LeadResponse'];

const router = vi.hoisted(() => ({ refresh: vi.fn<() => void>() }));
// The real Link, and a router that only counts refreshes (the real one needs Next's runtime).
// @ts-expect-error -- only what the dialog uses
vi.mock(import('@/libs/I18nNavigation'), async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => router,
}));
vi.mock(import('@/actions/crm/LeadActions'), () => ({ convertLead: vi.fn<typeof convertLead>() }));
vi.mock(import('@/actions/crm/RecordSearchActions'), () => ({
  searchRecords: vi.fn<typeof searchRecords>(),
}));

const LEAD: Lead = {
  id: 42,
  firstName: 'Mia',
  lastName: 'Chan',
  companyName: 'Acme',
  email: 'mia@acme.test',
  priority: 'MEDIUM',
  status: 'QUALIFIED',
  estimatedValue: '1250.00',
  currency: 'EUR',
  archived: false,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  version: 3,
};
const STAGES: components['schemas']['StageResponse'][] = [
  {
    id: 11,
    name: 'Qualification',
    kind: 'OPEN',
    position: 1,
    probability: 10,
    dealCount: 0,
    version: 1,
  },
  {
    id: 12,
    name: 'Proposal',
    kind: 'OPEN',
    position: 2,
    probability: 50,
    dealCount: 0,
    version: 1,
  },
];
const CURRENCIES = [
  { value: 'EUR', label: 'EUR · Euro' },
  { value: 'USD', label: 'USD · US dollar' },
];
const CONVERSION: components['schemas']['LeadConversionResponse'] = {
  leadId: 42,
  company: { id: 7, name: 'Acme' },
  contact: { id: 9, fullName: 'Mia Chan' },
  deal: { id: 5, name: 'Acme — deal' },
  alreadyConverted: false,
};

const openDialog = async (lead: Lead = LEAD) => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <ConvertDialog
        workspaceId={1}
        lead={lead}
        stages={STAGES}
        defaultCurrency="USD"
        currencies={CURRENCIES}
        timeZone="UTC"
        headingId="lead-heading"
      />
    </NextIntlClientProvider>,
  );
  await page.getByRole('button', { name: 'Convert lead', exact: true }).click();
};

const submit = () => page.getByRole('button', { name: 'Convert', exact: true });
const summaryLink = (name: string) => page.getByRole('dialog').getByRole('link', { name });

describe(ConvertDialog, () => {
  it('starts from the lead: its company, a contact made from it, a deal of its value in the first open stage', async () => {
    await openDialog();

    await expect.element(page.getByRole('radio', { name: 'Create Acme' })).toBeChecked();
    await expect.element(page.getByRole('radio', { name: 'Create from this lead' })).toBeChecked();
    await expect.element(page.getByRole('switch', { name: 'Create a deal' })).toBeChecked();
    await expect.element(page.getByLabelText('Deal name')).toHaveValue('Acme — deal');
    await expect.element(page.getByLabelText('Amount')).toHaveValue('1250.00');
    await expect.element(page.getByLabelText('Currency')).toHaveValue('EUR');
    await expect.element(page.getByLabelText('Stage')).toHaveValue('11');
  });

  it('sends that as one conversion', async () => {
    vi.mocked(convertLead).mockReset().mockResolvedValue({ ok: true, conversion: CONVERSION });
    await openDialog();

    await submit().click();

    await expect.element(summaryLink('Acme')).toBeVisible();
    expect(convertLead).toHaveBeenCalledExactlyOnceWith(1, 42, {
      companyId: null,
      createCompany: true,
      contactId: null,
      deal: {
        name: 'Acme — deal',
        amount: '1250.00',
        currency: 'EUR',
        stageId: 11,
        expectedCloseDate: null,
      },
    });
  });

  it('offers no new company without a company name, and starts the deal from the name', async () => {
    await openDialog({
      ...LEAD,
      companyName: undefined,
      estimatedValue: undefined,
      currency: undefined,
    });

    await expect.element(page.getByRole('radio', { name: 'No company' })).toBeChecked();
    expect(page.getByRole('radio', { name: /^Create (?!from)/u }).elements()).toHaveLength(0);
    await expect.element(page.getByLabelText('Deal name')).toHaveValue('Mia Chan — deal');
    await expect.element(page.getByLabelText('Amount')).toHaveValue('');
    // The workspace's currency, as the lead has none.
    await expect.element(page.getByLabelText('Currency')).toHaveValue('USD');
  });

  it("searches the lead's company name and email when linking, and sends the records picked", async () => {
    vi.mocked(searchRecords)
      .mockReset()
      .mockImplementation(
        async (_workspace, kind) =>
          await Promise.resolve(
            kind === 'company' ? [{ id: 8, label: 'Globex' }] : [{ id: 9, label: 'Pat Buyer' }],
          ),
      );
    vi.mocked(convertLead).mockReset().mockResolvedValue({ ok: true, conversion: CONVERSION });
    await openDialog();

    await page.getByRole('radio', { name: 'Link an existing company' }).click();
    await page.getByRole('combobox', { name: 'Company' }).click();
    expect(searchRecords).toHaveBeenLastCalledWith(1, 'company', 'Acme');
    await page.getByRole('option', { name: /Globex/u }).click();
    await page.getByRole('radio', { name: 'Link an existing contact' }).click();
    await page.getByRole('combobox', { name: 'Contact' }).click();
    expect(searchRecords).toHaveBeenLastCalledWith(1, 'contact', 'mia@acme.test');
    await page.getByRole('option', { name: /Pat Buyer/u }).click();
    await submit().click();

    await expect.element(summaryLink('Acme')).toBeVisible();
    expect(convertLead).toHaveBeenCalledWith(
      1,
      42,
      expect.objectContaining({ companyId: 8, createCompany: false, contactId: 9 }),
    );
  });

  it('shows a deal.stageId error under the stage, and lets the user try again', async () => {
    vi.mocked(convertLead)
      .mockReset()
      .mockResolvedValue({
        ok: false,
        message: 'Something in the request is not valid.',
        fieldErrors: { 'deal.stageId': 'must be an open stage' },
      });
    await openDialog();

    await submit().click();

    await expect
      .element(page.getByLabelText('Stage'))
      .toHaveAccessibleDescription('must be an open stage');
    await expect.element(page.getByText('Something in the request is not valid.')).toBeVisible();
    await expect.element(submit()).toBeEnabled();
  });

  it('sends nothing while the deal amount is not money', async () => {
    vi.mocked(convertLead).mockReset();
    await openDialog();

    await page.getByLabelText('Amount').fill('1,250.50');
    await submit().click();

    await expect.element(page.getByText(/Enter an amount like 1250\.50/u)).toBeVisible();
    expect(convertLead).not.toHaveBeenCalled();
  });

  it('leaves the deal out when its switch is off', async () => {
    vi.mocked(convertLead).mockReset().mockResolvedValue({ ok: true, conversion: CONVERSION });
    await openDialog();

    await page.getByRole('switch', { name: 'Create a deal' }).click();
    await submit().click();

    await expect.element(summaryLink('Acme')).toBeVisible();
    expect(convertLead).toHaveBeenCalledWith(1, 42, expect.objectContaining({ deal: null }));
  });

  it('converts once on a double click, and stays disabled until the answer', async () => {
    const { promise, resolve } = Promise.withResolvers<ConvertResult>();
    vi.mocked(convertLead).mockReset().mockReturnValue(promise);
    await openDialog();

    await submit().dblClick();

    await expect.element(submit()).toBeDisabled();
    resolve({ ok: true, conversion: CONVERSION });
    await expect.element(summaryLink('Acme')).toBeVisible();
    expect(convertLead).toHaveBeenCalledOnce();
  });

  it('converts once when the form is submitted twice before it re-renders', async () => {
    const { promise, resolve } = Promise.withResolvers<ConvertResult>();
    vi.mocked(convertLead).mockReset().mockReturnValue(promise);
    await openDialog();

    const form = document.querySelector('[role="dialog"] form');
    if (!(form instanceof HTMLFormElement)) {
      throw new TypeError('The dialog holds no form');
    }
    form.requestSubmit();
    form.requestSubmit();

    await expect.poll(() => vi.mocked(convertLead).mock.calls.length).toBe(1);
    resolve({ ok: true, conversion: CONVERSION });
    await expect.element(summaryLink('Acme')).toBeVisible();
    expect(convertLead).toHaveBeenCalledOnce();
  });

  it('stays open while a conversion is pending, and shows its answer when it lands', async () => {
    const { promise, resolve } = Promise.withResolvers<ConvertResult>();
    vi.mocked(convertLead).mockReset().mockReturnValue(promise);
    router.refresh.mockClear();
    await openDialog();
    await submit().click();
    await expect.element(submit()).toBeDisabled();
    const dialog = page.getByRole('dialog');

    await userEvent.keyboard('{Escape}');
    await expect.element(dialog).toBeVisible();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect.element(dialog).toBeVisible();
    // A click outside the dialog (forced: the overlay has no size without a stylesheet).
    await page.elementLocator(document.body).click({ position: { x: 1, y: 1 }, force: true });
    await expect.element(dialog).toBeVisible();

    resolve({ ok: true, conversion: CONVERSION });
    await expect.element(summaryLink('Acme')).toBeVisible();
    expect(convertLead).toHaveBeenCalledOnce();
    await page.getByRole('button', { name: 'Done' }).click();
    await expect.element(dialog).not.toBeInTheDocument();
    expect(router.refresh).toHaveBeenCalledOnce();
  });

  it.each([false, true])(
    'shows the same summary of what was made, whether or not it was already converted (%s)',
    async (alreadyConverted) => {
      vi.mocked(convertLead)
        .mockReset()
        .mockResolvedValue({ ok: true, conversion: { ...CONVERSION, alreadyConverted } });
      router.refresh.mockClear();
      await openDialog();

      await submit().click();

      await expect.element(summaryLink('Acme')).toHaveAttribute('href', '/app/1/companies/7');
      await expect.element(summaryLink('Mia Chan')).toHaveAttribute('href', '/app/1/contacts/9');
      await expect.element(page.getByRole('dialog').getByText('Acme — deal')).toBeVisible();
      const note = page.getByText('This lead was already converted');
      await expect.poll(() => note.elements().length).toBe(alreadyConverted ? 1 : 0);
      // The page behind catches up when the dialog is done with.
      expect(router.refresh).not.toHaveBeenCalled();
      await page.getByRole('button', { name: 'Done' }).click();
      expect(router.refresh).toHaveBeenCalledOnce();
    },
  );
});
