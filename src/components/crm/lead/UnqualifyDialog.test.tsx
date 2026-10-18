import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { changeLeadStatus } from '@/actions/crm/LeadActions';
import messages from '@/locales/en.json';
import { UnqualifyDialog } from './UnqualifyDialog';

vi.mock(import('@/actions/crm/LeadActions'), () => ({
  changeLeadStatus: vi.fn<typeof changeLeadStatus>(),
}));

const openDialog = async () => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <UnqualifyDialog
        workspaceId={1}
        leadId={42}
        version={3}
        name="Mia Chan"
        open
        onOpenChange={vi.fn<() => void>()}
      />
    </NextIntlClientProvider>,
  );
};

const submit = () => page.getByRole('button', { name: 'Mark as unqualified' });

describe(UnqualifyDialog, () => {
  it('needs a reason, and sends nothing without one', async () => {
    vi.mocked(changeLeadStatus).mockReset();
    await openDialog();

    await submit().click();

    await expect.element(page.getByText('Required')).toBeVisible();
    expect(changeLeadStatus).not.toHaveBeenCalled();
  });

  it('refuses a reason over 500 characters', async () => {
    vi.mocked(changeLeadStatus).mockReset();
    await openDialog();

    await page.getByLabelText('Reason').fill('x'.repeat(501));
    await submit().click();

    await expect.element(page.getByText('Too long')).toBeVisible();
    expect(changeLeadStatus).not.toHaveBeenCalled();
  });

  it('sends the status with the reason and the version read, and shows a refusal in the dialog', async () => {
    vi.mocked(changeLeadStatus).mockReset().mockResolvedValue({
      ok: false,
      message: 'This lead was converted, so it cannot be changed.',
    });
    await openDialog();

    await page.getByLabelText('Reason').fill('  Budget too small ');
    await submit().click();

    await expect
      .element(
        page.getByRole('dialog').getByText('This lead was converted, so it cannot be changed.'),
      )
      .toBeVisible();
    expect(changeLeadStatus).toHaveBeenCalledWith(1, 42, 3, {
      status: 'UNQUALIFIED',
      reason: 'Budget too small',
    });
  });
});
