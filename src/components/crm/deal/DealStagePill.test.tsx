import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { moveDeal } from '@/actions/crm/DealActions';
import * as DealActions from '@/actions/crm/DealActions';
import { Toaster } from '@/components/ui/sonner';
import messages from '@/locales/en.json';
import { DealStagePill } from './DealStagePill';

vi.mock(import('@/actions/crm/DealActions'), () => ({ moveDeal: vi.fn<typeof moveDeal>() }));

const STAGES = [
  { id: 11, name: 'Qualification', kind: 'OPEN' as const },
  { id: 12, name: 'Proposal', kind: 'OPEN' as const },
  { id: 13, name: 'Won', kind: 'WON' as const },
  { id: 14, name: 'Lost', kind: 'LOST' as const },
];

const renderPill = async (canEdit = true) => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <DealStagePill
        workspaceId={1}
        deal={{
          id: 101,
          name: 'Acme renewal',
          version: 3,
          stage: { id: 11, name: 'Qualification', kind: 'OPEN' },
        }}
        stages={STAGES}
        canEdit={canEdit}
      />
      <Toaster />
    </NextIntlClientProvider>,
  );
};

const pill = () => page.getByRole('button', { name: 'Stage: Qualification' });

describe(DealStagePill, () => {
  beforeEach(() => {
    vi.mocked(DealActions.moveDeal).mockReset().mockResolvedValue({ ok: true, version: 4 });
  });

  it('moves the deal to the stage chosen from its pill, with the version it was read at', async () => {
    await renderPill();

    await pill().click();
    await page.getByRole('menuitem', { name: 'Won' }).click();

    expect(DealActions.moveDeal).toHaveBeenCalledWith(1, 101, {
      stageId: 13,
      version: 3,
      lostReason: undefined,
    });
    await expect.element(page.getByText('Acme renewal moved to Won')).toBeVisible();
  });

  it('asks why before Lost, and moves nothing when cancelled', async () => {
    await renderPill();

    await pill().click();
    await page.getByRole('menuitem', { name: 'Lost' }).click();
    const dialog = page.getByRole('dialog', { name: 'Mark Acme renewal as lost' });
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    expect(DealActions.moveDeal).not.toHaveBeenCalled();

    await pill().click();
    await page.getByRole('menuitem', { name: 'Lost' }).click();
    await dialog.getByLabelText('Reason').fill('Budget frozen');
    await dialog.getByRole('button', { name: 'Mark as lost' }).click();
    expect(DealActions.moveDeal).toHaveBeenCalledWith(1, 101, {
      stageId: 14,
      version: 3,
      lostReason: 'Budget frozen',
    });
  });

  it('keeps the stage and names the refusal under the pill', async () => {
    vi.mocked(DealActions.moveDeal).mockResolvedValue({
      ok: false,
      message: "Your role doesn't allow this.",
    });
    await renderPill();

    await pill().click();
    await page.getByRole('menuitem', { name: 'Proposal' }).click();

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent("Your role doesn't allow this.");
    await expect.element(pill()).toBeVisible();
  });

  it('is the pill alone for a deal the caller may not move', async () => {
    await renderPill(false);

    expect(page.getByRole('button').elements()).toHaveLength(0);
    await expect.element(page.getByText('Stage: Qualification')).toBeInTheDocument();
  });
});
