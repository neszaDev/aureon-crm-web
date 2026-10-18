import { NextIntlClientProvider } from 'next-intl';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { searchRecords } from '@/actions/crm/RecordSearchActions';
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

      await page.getByLabelText('Amount').fill(amount);
      await page.getByRole('button', { name: 'Create deal' }).click();

      await expect.element(page.getByLabelText('Amount')).toHaveAttribute('aria-invalid', 'true');
      await expect.element(page.getByText(/Enter an amount like 1250\.50/u).first()).toBeVisible();
      expect(action).not.toHaveBeenCalled();
    },
  );

  it('sends the amount as typed, with the stage chosen and the owner kept', async () => {
    const action = vi.fn<Action>().mockResolvedValue({ ok: true });
    await render(form({ action }));

    await page.getByLabelText('Amount').fill('1250.50');
    await page.getByLabelText('Stage').selectOptions('12');
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

    expect(page.getByLabelText('Stage').elements()).toHaveLength(0);
    await expect.element(page.getByText('Proposal', { exact: true })).toBeVisible();
    await expect.element(page.getByText("Change it with Move on the deal's page.")).toBeVisible();
  });

  it('server-renders the stage and the currency as the selected options', () => {
    const html = renderToString(
      form({ action: vi.fn<Action>(), defaults: { ...NEW, stageId: 12, currency: 'USD' } }),
    );
    const selected = (id: string) =>
      new DOMParser()
        .parseFromString(html, 'text/html')
        .querySelector(`#${id} option[selected]`)
        ?.getAttribute('value');

    expect(selected('deal-stage')).toBe('12');
    expect(selected('deal-currency')).toBe('USD');
  });

  it('sends what was typed since the last save, not the values saved before', async () => {
    const action = vi.fn<Action>().mockResolvedValue({ ok: true });
    await render(form({ action }));

    await page.getByLabelText('Amount').fill('100.00');
    await page.getByRole('button', { name: 'Create deal' }).click();
    await expect.element(page.getByText('Saved', { exact: true })).toBeVisible();
    await page.getByLabelText('Amount').fill('200.00');
    await page.getByRole('button', { name: 'Create deal' }).click();

    await vi.waitFor(() => {
      expect(action).toHaveBeenCalledTimes(2);
    });
    expect(action).toHaveBeenLastCalledWith(expect.objectContaining({ amount: '200.00' }));
  });
});
