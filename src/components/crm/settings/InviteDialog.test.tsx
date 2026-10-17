import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { CreatedInvitation } from '@/actions/crm/InvitationActions';
import type { ActionResult } from '@/libs/api/ApiError';
import messages from '@/locales/en.json';
import type { InvitationValues } from '@/validations/crm/InvitationValidation';
import { InviteDialog } from './InviteDialog';

const LINK = 'http://localhost:3000/invite/secret-token';

type Invite = (
  values: InvitationValues,
) => Promise<ActionResult & { invitation?: CreatedInvitation }>;

const renderDialog = async (action: Invite) => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <InviteDialog
        action={action}
        roles={['ADMIN', 'MANAGER', 'SALES_REP']}
        timeZone="Asia/Bangkok"
      />
    </NextIntlClientProvider>,
  );
};

const invite = async (email: string) => {
  await page.getByRole('button', { name: 'Invite member' }).click();
  await page.getByLabelText('Email address').fill(email);
  await page.getByLabelText('Role').selectOptions('MANAGER');
  await page.getByRole('button', { name: 'Create invitation link' }).click();
};

describe(InviteDialog, () => {
  it('shows the link once, with a labelled copy button and the expiry', async () => {
    const action = vi.fn<Invite>().mockResolvedValue({
      ok: true,
      invitation: {
        email: 'ana@example.com',
        role: 'MANAGER',
        expiresAt: '2026-10-25T03:00:00Z',
        link: LINK,
      },
    });
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    await renderDialog(action);

    await invite(' Ana@Example.com ');

    expect(action).toHaveBeenCalledWith({ email: 'ana@example.com', role: 'MANAGER' });
    await expect.element(page.getByLabelText('Invitation link', { exact: true })).toHaveValue(LINK);
    await expect
      .element(page.getByText('It expires on October 25, 2026 at 10:00 AM (Asia/Bangkok time).'))
      .toBeVisible();
    const copy = page.getByRole('button', { name: 'Copy link' });
    await expect.element(copy).toHaveFocus();

    await copy.click();

    expect(writeText).toHaveBeenCalledWith(LINK);
    await expect.element(page.getByText('Link copied')).toBeVisible();

    // Closed and opened again: a new invitation, the link is gone.
    await page.getByRole('button', { name: 'Done' }).click();
    await page.getByRole('button', { name: 'Invite member' }).click();

    await expect.element(page.getByLabelText('Email address')).toHaveValue('');
    expect(page.getByLabelText('Invitation link', { exact: true }).elements()).toHaveLength(0);
  });

  it('offers only the roles the caller may give', async () => {
    await renderDialog(vi.fn<Invite>());

    await page.getByRole('button', { name: 'Invite member' }).click();

    expect(page.getByRole('option', { name: 'Owner' }).elements()).toHaveLength(0);
    await expect.element(page.getByLabelText('Role')).toHaveValue('SALES_REP');
  });

  it("keeps the form and shows the backend's refusal", async () => {
    await renderDialog(
      vi.fn<Invite>().mockResolvedValue({
        ok: false,
        message: 'This email already has a pending invitation',
      }),
    );

    await invite('ana@example.com');

    await expect
      .element(page.getByText('This email already has a pending invitation'))
      .toBeVisible();
    expect(page.getByLabelText('Invitation link', { exact: true }).elements()).toHaveLength(0);
  });
});
