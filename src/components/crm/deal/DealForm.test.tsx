import { NextIntlClientProvider } from 'next-intl';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { searchRecords } from '@/actions/crm/RecordSearchActions';
import { InRecordPanel } from '@/components/crm/record/RecordPanel';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import type { ActionResult } from '@/libs/api/ApiError';
import type { components } from '@/libs/api/schema';
import messages from '@/locales/en.json';
import type { DealValues } from '@/validations/crm/DealValidation';
import { DealForm } from './DealForm';

// The company and contact pickers search through a server action.
vi.mock(import('@/actions/crm/RecordSearchActions'), () => ({
  searchRecords: vi.fn<typeof searchRecords>(),
}));

type Action = (values: DealValues) => Promise<ActionResult>;

const ME = 1;
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
const NEW: DealValues = {
  name: 'Acme renewal',
  amount: '',
  currency: '',
  stageId: 11,
  probability: '',
  expectedCloseDate: '',
  ownerId: ME,
  companyId: null,
  contactId: null,
  sourceId: null,
  notes: '',
};

const form = (props: { action: Action; defaults?: DealValues; isEdit?: boolean }) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <DealForm
      action={props.action}
      defaults={props.defaults ?? NEW}
      isEdit={props.isEdit}
      workspaceId={1}
      company={null}
      contact={null}
      members={[{ userId: ME, email: 'mia@acme.test', displayName: 'Mia Manager' }]}
      me={ME}
      canAssign
      sources={[]}
      stages={STAGES}
      stageName="Proposal"
      defaultCurrency="EUR"
      currencies={[
        { value: 'EUR', label: 'EUR · Euro' },
        { value: 'USD', label: 'USD · US dollar' },
      ]}
      timeZone="UTC"
      cancelHref="/app/1/deals"
      submitLabel="Create deal"
    />
  </NextIntlClientProvider>
);

describe(DealForm, () => {
  it.each(['1,250.50', '1e3', '0.001', '-5', '12345678901234'])(
    'shows a field error and sends nothing for the amount %j',
    async (amount) => {
      const action = vi.fn<Action>().mockResolvedValue({ ok: true });
      await render(form({ action }));

      await page.getByRole('button', { name: 'Amount', exact: true }).click();
      await page.getByLabelText('Amount').fill(amount);
      await page.getByRole('button', { name: 'Create deal' }).click();

      // Said under the chips and on the chip, and on the field once the chip is open again.
      await expect.element(page.getByText(/Enter an amount like 1250\.50/u).first()).toBeVisible();
      const chip = page.getByRole('button', { name: /^Amount:/u });
      await expect.element(chip).toHaveAccessibleDescription(/Enter an amount like 1250\.50/u);
      await chip.click();
      await expect.element(page.getByLabelText('Amount')).toHaveAttribute('aria-invalid', 'true');
      expect(action).not.toHaveBeenCalled();
    },
  );

  it('sends the amount as typed, with the stage chosen and the owner kept', async () => {
    const action = vi.fn<Action>().mockResolvedValue({ ok: true });
    await render(form({ action }));

    await page.getByRole('button', { name: 'Amount', exact: true }).click();
    await page.getByLabelText('Amount').fill('1250.50');
    await page.getByRole('button', { name: 'Stage: Qualification' }).click();
    await page.getByLabelText('Stage').selectOptions('12');
    await expect.element(page.getByRole('button', { name: 'Stage: Proposal' })).toBeVisible();
    await page.getByRole('button', { name: 'Create deal' }).click();

    await expect.element(page.getByText('Saved', { exact: true })).toBeVisible();
    expect(action).toHaveBeenCalledExactlyOnceWith({
      ...NEW,
      amount: '1250.50',
      stageId: 12,
    });
  });

  it("marks the field invalid and shows the backend's error under it", async () => {
    const action = vi.fn<Action>().mockResolvedValue({
      ok: false,
      message: 'Check the highlighted fields and try again.',
      fieldErrors: { companyId: 'is not a company of this workspace' },
    });
    await render(form({ action, defaults: { ...NEW, amount: '10' } }));

    await page.getByRole('button', { name: 'Create deal' }).click();

    const chip = page.getByRole('button', { name: 'Company', exact: true });
    await expect
      .element(chip)
      .toHaveAccessibleDescription('Company: is not a company of this workspace');
    await chip.click();
    await expect
      .element(page.getByRole('combobox', { name: 'Company' }))
      .toHaveAccessibleDescription('is not a company of this workspace');
    await expect
      .element(page.getByRole('combobox', { name: 'Company' }))
      .toHaveAttribute('aria-invalid', 'true');
  });

  it('offers a reload when someone else saved the deal first', async () => {
    const action = vi.fn<Action>().mockResolvedValue({
      ok: false,
      conflict: true,
      message: 'Someone else changed this. Reload to see their version.',
    });
    await render(form({ action, isEdit: true, defaults: { ...NEW, amount: '10', stageId: null } }));

    await page.getByRole('button', { name: 'Create deal' }).click();

    await expect
      .element(page.getByText('Someone else changed this. Reload to see their version.'))
      .toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Reload' })).toBeVisible();
  });

  it('has no stage to choose when a deal is edited: only a move changes it', async () => {
    await render(
      form({ action: vi.fn<Action>(), isEdit: true, defaults: { ...NEW, stageId: null } }),
    );

    await page.getByRole('button', { name: 'Stage: Proposal' }).click();
    expect(page.getByLabelText('Stage').elements()).toHaveLength(0);
    await expect.element(page.getByText('Proposal', { exact: true }).last()).toBeVisible();
    await expect.element(page.getByText("Change it with Move on the deal's page.")).toBeVisible();
  });

  it('server-renders the stage and the amount with its currency in their chips', () => {
    const html = renderToString(
      form({
        action: vi.fn<Action>(),
        defaults: { ...NEW, stageId: 12, amount: '10', currency: 'USD' },
      }),
    );
    const chip = (id: string) =>
      new DOMParser().parseFromString(html, 'text/html').querySelector(`#${id}`)?.textContent;

    expect(chip('deal-stage-chip')).toBe('Stage: Proposal');
    expect(chip('deal-amount-chip')).toBe('Amount: 10 USD');
  });

  it('keeps its ids its own in a record panel over the full page of a deal form', async () => {
    const action = vi.fn<Action>();
    await render(
      <>
        {form({ action })}
        <Sheet open>
          <SheetContent closeLabel="Close">
            <SheetTitle>New deal</SheetTitle>
            <InRecordPanel value>{form({ action, defaults: { ...NEW, name: '' } })}</InRecordPanel>
          </SheetContent>
        </Sheet>
      </>,
    );
    const panel = page.getByRole('dialog', { name: 'New deal' });

    await panel.getByRole('button', { name: 'Create deal' }).click();

    // The panel's label, chips and error point at its own field, not at the page's.
    const name = panel.getByLabelText('Deal name');
    await expect.element(name).toHaveValue('');
    await expect.element(name).toHaveAccessibleDescription('Required');
    await expect.element(name).toHaveAttribute('aria-invalid', 'true');
    await expect.element(panel.getByRole('button', { name: /^Stage:/u })).toBeVisible();
    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);

    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toStrictEqual([]);
    expect(action).not.toHaveBeenCalled();
  });

  it('sends what was typed since the last save, not the values saved before', async () => {
    const action = vi.fn<Action>().mockResolvedValue({ ok: true });
    await render(form({ action }));

    await page.getByRole('button', { name: 'Amount', exact: true }).click();
    await page.getByLabelText('Amount').fill('100.00');
    await page.getByRole('button', { name: 'Create deal' }).click();
    await expect.element(page.getByText('Saved', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Amount: 100.00 EUR' }).click();
    await page.getByLabelText('Amount').fill('200.00');
    await page.getByRole('button', { name: 'Create deal' }).click();

    await vi.waitFor(() => {
      expect(action).toHaveBeenCalledTimes(2);
    });
    expect(action).toHaveBeenLastCalledWith(expect.objectContaining({ amount: '200.00' }));
  });
});
