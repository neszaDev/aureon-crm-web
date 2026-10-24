import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { changeLeadStatus } from '@/actions/crm/LeadActions';
import * as LeadActions from '@/actions/crm/LeadActions';
import { Toaster } from '@/components/ui/sonner';
import messages from '@/locales/en.json';
import { LeadStatusPill } from './LeadStatusPill';

vi.mock(import('@/actions/crm/LeadActions'), () => ({
  changeLeadStatus: vi.fn<typeof changeLeadStatus>(),
}));

const renderPill = async (status: 'NEW' | 'CONVERTED' = 'NEW') => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <LeadStatusPill
        workspaceId={1}
        lead={{ id: 42, status, version: 3 }}
        name="Mia Chan"
        canEdit
      />
      <Toaster />
    </NextIntlClientProvider>,
  );
};

describe(LeadStatusPill, () => {
  beforeEach(() => {
    vi.mocked(LeadActions.changeLeadStatus).mockReset().mockResolvedValue({ ok: true });
  });

  it('offers the other statuses a change takes, and sends the one chosen', async () => {
    await renderPill();

    await page.getByRole('button', { name: 'Status: New' }).click();
    expect(
      page
        .getByRole('menuitem')
        .elements()
        .map((item) => item.textContent),
    ).toStrictEqual(['Contacted', 'Qualified', 'Unqualified']);
    await page.getByRole('menuitem', { name: 'Contacted' }).click();

    expect(LeadActions.changeLeadStatus).toHaveBeenCalledWith(1, 42, 3, {
      status: 'CONTACTED',
      reason: '',
    });
    await expect.element(page.getByText('Status changed to Contacted')).toBeVisible();
  });

  it('asks for the reason before Unqualified', async () => {
    await renderPill();

    await page.getByRole('button', { name: 'Status: New' }).click();
    await page.getByRole('menuitem', { name: 'Unqualified' }).click();

    await expect
      .element(page.getByRole('dialog', { name: 'Mark Mia Chan as unqualified' }))
      .toBeVisible();
    expect(LeadActions.changeLeadStatus).not.toHaveBeenCalled();
  });

  it('keeps the status and offers a reload when someone changed the lead first', async () => {
    vi.mocked(LeadActions.changeLeadStatus).mockResolvedValue({
      ok: false,
      message: 'Someone else changed this. Reload to see their version.',
      conflict: true,
    });
    await renderPill();

    await page.getByRole('button', { name: 'Status: New' }).click();
    await page.getByRole('menuitem', { name: 'Qualified', exact: true }).click();

    await expect.element(page.getByRole('alert')).toHaveTextContent('Someone else changed this.');
    await expect.element(page.getByRole('button', { name: 'Reload' })).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Status: New' })).toBeVisible();
  });

  it('is the pill alone once converted', async () => {
    await renderPill('CONVERTED');

    expect(page.getByRole('button').elements()).toHaveLength(0);
  });
});
