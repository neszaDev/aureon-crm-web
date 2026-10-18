import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { moveDeal } from '@/actions/crm/DealActions';
import * as DealActions from '@/actions/crm/DealActions';
import { Toaster } from '@/components/ui/sonner';
import messages from '@/locales/en.json';
import { MoveDealDialog } from './MoveDealDialog';

vi.mock(import('@/actions/crm/DealActions'), () => ({ moveDeal: vi.fn<typeof moveDeal>() }));

const STAGES = [
  { id: 11, name: 'Qualification', kind: 'OPEN' as const },
  { id: 12, name: 'Proposal', kind: 'OPEN' as const },
  { id: 13, name: 'Won', kind: 'WON' as const },
  { id: 14, name: 'Lost', kind: 'LOST' as const },
];

const openDialog = async () => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <MoveDealDialog
        workspaceId={1}
        deal={{ id: 101, name: 'Acme renewal', version: 3, stageId: 11 }}
        stages={STAGES}
        trigger={<button type="button">Move</button>}
      />
      <Toaster />
    </NextIntlClientProvider>,
  );
  await page.getByRole('button', { name: 'Move', exact: true }).click();
};

const stage = () => page.getByLabelText('Stage', { exact: true });
const submit = () => page.getByRole('button', { name: 'Move deal' });

describe(MoveDealDialog, () => {
  beforeEach(() => {
    vi.mocked(DealActions.moveDeal).mockReset().mockResolvedValue({ ok: true, version: 4 });
  });

  it('starts at the stage after the deal’s own, which is open and asks nothing more', async () => {
    await openDialog();

    await expect.element(stage()).toHaveValue('12');
    expect(page.getByLabelText('Reason').elements()).toHaveLength(0);
  });

  it('says that Won and Lost close the deal', async () => {
    await openDialog();

    await stage().selectOptions('13');
    await expect.element(page.getByText(/closes the deal as won/u)).toBeVisible();

    await stage().selectOptions('14');
    await expect.element(page.getByText(/closes the deal as lost/u)).toBeVisible();
  });

  it('needs a reason for Lost, and sends it with the move', async () => {
    await openDialog();
    await stage().selectOptions('14');

    await submit().click();

    await expect.element(page.getByText('Required')).toBeVisible();
    expect(DealActions.moveDeal).not.toHaveBeenCalled();

    await page.getByLabelText('Reason').fill('Went with a rival');
    await submit().click();

    expect(DealActions.moveDeal).toHaveBeenCalledExactlyOnceWith(1, 101, {
      stageId: 14,
      version: 3,
      lostReason: 'Went with a rival',
    });
  });

  it('moves to Won without the reason typed for Lost, however long it was', async () => {
    await openDialog();
    await stage().selectOptions('14');
    await page.getByLabelText('Reason').fill('a'.repeat(600));

    await stage().selectOptions('13');
    await submit().click();

    expect(DealActions.moveDeal).toHaveBeenCalledExactlyOnceWith(1, 101, {
      stageId: 13,
      version: 3,
      lostReason: undefined,
    });
  });

  it('limits the reason field to 500 characters', async () => {
    await openDialog();
    await stage().selectOptions('14');

    await expect.element(page.getByLabelText('Reason')).toHaveAttribute('maxlength', '500');
  });
});
