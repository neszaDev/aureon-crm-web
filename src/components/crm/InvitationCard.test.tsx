import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ActionResult } from '@/libs/api/ApiError';
import messages from '@/locales/en.json';
import type { InvitationRegisterValues } from '@/validations/crm/InvitationValidation';
import { InvitationCard } from './InvitationCard';

const TOKEN = 'secret-token';
const INVITATION = {
  workspaceId: 7,
  workspaceName: 'Acme',
  email: 'ana@example.com',
  role: 'MANAGER',
  status: 'PENDING',
  expiresAt: '2026-10-25T03:00:00Z',
} as const;

type Register = (token: string, values: InvitationRegisterValues) => Promise<ActionResult>;

const renderCard = async (props: {
  invitation?: Parameters<typeof InvitationCard>[0]['invitation'];
  user?: { email: string };
  accept?: (token: string) => Promise<ActionResult>;
  register?: Register;
  signOut?: (next: string) => Promise<void>;
}) => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <InvitationCard
        token={TOKEN}
        invitation={props.invitation}
        user={props.user}
        accept={props.accept ?? vi.fn<(token: string) => Promise<ActionResult>>()}
        register={props.register ?? vi.fn<Register>()}
        signOut={props.signOut ?? vi.fn<(next: string) => Promise<void>>()}
      />
    </NextIntlClientProvider>,
  );
};

describe(InvitationCard, () => {
  describe('signed out', () => {
    it('creates the account for the invited email only', async () => {
      const register = vi.fn<Register>().mockResolvedValue({
        ok: false,
        message: 'This email already has an account. Sign in to join.',
      });
      await renderCard({ invitation: INVITATION, register });

      await expect.element(page.getByRole('heading', { name: 'Join Acme' })).toBeVisible();
      await expect
        .element(page.getByText("You're invited as Manager.", { exact: false }))
        .toBeVisible();
      // Shown, not editable: no field holds it but the hidden one for password managers.
      await expect.element(page.getByText('ana@example.com')).toBeVisible();
      expect(page.getByRole('textbox', { name: 'Email address' }).elements()).toHaveLength(0);
      // The seal previews the initials of the name being typed.
      await expect.element(page.getByText('AN', { exact: true })).toBeVisible();

      await page.getByLabelText('Password').fill('123');
      await page.getByRole('button', { name: 'Create account and join' }).click();
      await expect.element(page.getByText('Use at least 6 characters')).toBeVisible();
      expect(register).not.toHaveBeenCalled();

      await page.getByLabelText('Display name').fill(' Ana Lima ');
      await expect.element(page.getByText('AL', { exact: true })).toBeVisible();
      await page.getByLabelText('Password').fill('a-secure-password');
      await page.getByRole('button', { name: 'Create account and join' }).click();

      expect(register).toHaveBeenCalledWith(TOKEN, {
        displayName: 'Ana Lima',
        password: 'a-secure-password',
      });
      await expect
        .element(page.getByRole('alert'))
        .toHaveTextContent('This email already has an account. Sign in to join.');
      await expect
        .element(page.getByRole('link', { name: 'Sign in to join' }))
        .toHaveAttribute('href', `/sign-in?next=${encodeURIComponent(`/invite/${TOKEN}`)}`);
    });
  });

  describe('signed in', () => {
    it('joins with the invited email', async () => {
      const accept = vi.fn<(token: string) => Promise<ActionResult>>().mockResolvedValue({
        ok: false,
        message: 'This invitation is no longer pending',
      });
      await renderCard({ invitation: INVITATION, user: { email: 'ana@example.com' }, accept });

      await page.getByRole('button', { name: 'Join Acme' }).click();

      expect(accept).toHaveBeenCalledWith(TOKEN);
      await expect
        .element(page.getByRole('alert'))
        .toHaveTextContent('This invitation is no longer pending');
    });

    it('offers to sign out with another email, then come back', async () => {
      const signOut = vi.fn<(next: string) => Promise<void>>().mockResolvedValue();
      await renderCard({ invitation: INVITATION, user: { email: 'bob@example.com' }, signOut });

      await expect
        .element(page.getByRole('heading', { name: 'This invitation is for another account' }))
        .toBeVisible();
      await expect.element(page.getByText('ana@example.com')).toBeVisible();
      await expect.element(page.getByText('bob@example.com')).toBeVisible();
      expect(page.getByRole('button', { name: 'Join Acme' }).elements()).toHaveLength(0);

      await page.getByRole('button', { name: 'Sign out' }).click();

      expect(signOut).toHaveBeenCalledWith(`/invite/${TOKEN}`);
    });
  });

  describe('closed', () => {
    it.each([
      ['ACCEPTED', 'This invitation has already been used', 'Go to your workspaces'],
      ['REVOKED', 'This invitation was cancelled', 'Back to home'],
      ['EXPIRED', 'This invitation has expired', 'Back to home'],
    ] as const)('explains a %s invitation', async (status, title, link) => {
      await renderCard({
        invitation: { ...INVITATION, status },
        user: { email: 'ana@example.com' },
      });

      await expect.element(page.getByRole('heading', { name: title })).toBeVisible();
      await expect.element(page.getByText('Acme', { exact: false })).toBeVisible();
      await expect.element(page.getByRole('link', { name: link })).toBeVisible();
      expect(page.getByRole('button').elements()).toHaveLength(0);
    });

    it('explains an unknown link', async () => {
      await renderCard({});

      await expect
        .element(page.getByRole('heading', { name: "This invitation link doesn't work" }))
        .toBeVisible();
      await expect
        .element(page.getByRole('link', { name: 'Back to home' }))
        .toHaveAttribute('href', '/');
    });
  });
});
