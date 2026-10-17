import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ActionResult } from '@/libs/api/ApiError';
import messages from '@/locales/en.json';
import type { WorkspaceRole } from '@/validations/crm/MemberValidation';
import type { MemberRow } from './MembersTable';
import { MembersTable } from './MembersTable';

const OWNER: MemberRow = {
  userId: 1,
  email: 'olga@example.com',
  displayName: 'Olga Owner',
  role: 'OWNER',
  joined: 'Oct 1, 2026',
};
const ADMIN: MemberRow = {
  userId: 2,
  email: 'adam@example.com',
  displayName: 'Adam Admin',
  role: 'ADMIN',
  joined: 'Oct 2, 2026',
};
const MANAGER: MemberRow = {
  userId: 3,
  email: 'mia@example.com',
  displayName: 'Mia Manager',
  role: 'MANAGER',
  joined: 'Oct 3, 2026',
};

type ChangeRole = (userId: number, role: WorkspaceRole) => Promise<ActionResult>;
type Remove = (userId: number) => Promise<ActionResult>;

const renderTable = async (options: {
  members: MemberRow[];
  me: number;
  callerRole: WorkspaceRole;
  changeRole?: ChangeRole;
}) => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <MembersTable
        members={options.members}
        me={options.me}
        callerRole={options.callerRole}
        canManage
        workspaceName="Acme"
        actions={{
          changeRole: options.changeRole ?? vi.fn<ChangeRole>().mockResolvedValue({ ok: true }),
          remove: vi.fn<Remove>().mockResolvedValue({ ok: true }),
        }}
      />
    </NextIntlClientProvider>,
  );
};

describe(MembersTable, () => {
  describe('as an admin', () => {
    it('leaves owner rows without controls and offers no Owner role', async () => {
      await renderTable({
        members: [OWNER, ADMIN, MANAGER],
        me: ADMIN.userId,
        callerRole: 'ADMIN',
      });

      expect(page.getByLabelText('Role of Olga Owner').elements()).toHaveLength(0);
      expect(page.getByRole('button', { name: 'Remove Olga Owner' }).elements()).toHaveLength(0);
      await expect.element(page.getByRole('cell', { name: 'Owner', exact: true })).toBeVisible();

      await expect.element(page.getByLabelText('Role of Mia Manager')).toHaveValue('MANAGER');
      await expect.element(page.getByRole('button', { name: 'Remove Mia Manager' })).toBeVisible();
      expect(page.getByRole('option', { name: 'Owner' }).elements()).toHaveLength(0);
    });

    it("changes another member's role straight away", async () => {
      const changeRole = vi.fn<ChangeRole>().mockResolvedValue({ ok: true });
      await renderTable({
        members: [OWNER, ADMIN, MANAGER],
        me: ADMIN.userId,
        callerRole: 'ADMIN',
        changeRole,
      });

      await page.getByLabelText('Role of Mia Manager').selectOptions('SALES_REP');

      expect(changeRole).toHaveBeenCalledWith(MANAGER.userId, 'SALES_REP');
      expect(page.getByRole('alertdialog').elements()).toHaveLength(0);
    });

    it('asks before changing your own role', async () => {
      const changeRole = vi.fn<ChangeRole>().mockResolvedValue({ ok: true });
      await renderTable({
        members: [OWNER, ADMIN, MANAGER],
        me: ADMIN.userId,
        callerRole: 'ADMIN',
        changeRole,
      });
      const own = page.getByLabelText('Role of Adam Admin');

      await own.selectOptions('SALES_REP');

      const dialog = page.getByRole('alertdialog');
      await expect
        .element(dialog.getByRole('heading', { name: 'Change your own role to Sales rep?' }))
        .toBeVisible();
      await expect.element(own).toHaveValue('ADMIN');
      await dialog.getByRole('button', { name: 'Cancel' }).click();
      expect(changeRole).not.toHaveBeenCalled();
      await expect.element(own).toHaveFocus();

      await own.selectOptions('MANAGER');
      await page.getByRole('button', { name: 'Change my role' }).click();

      expect(changeRole).toHaveBeenCalledWith(ADMIN.userId, 'MANAGER');
      await expect.poll(() => page.getByRole('alertdialog').elements()).toHaveLength(0);
    });
  });

  describe('as an owner', () => {
    it('says before leaving that the last owner must hand over first', async () => {
      await renderTable({ members: [OWNER, MANAGER], me: OWNER.userId, callerRole: 'OWNER' });

      await page.getByRole('button', { name: 'Leave workspace' }).click();

      await expect
        .element(
          page
            .getByRole('alertdialog')
            .getByText(
              'No one else owns this workspace. Make another member an owner before you leave.',
            ),
        )
        .toBeVisible();
    });

    it('leaves without the note when another owner remains', async () => {
      await renderTable({
        members: [OWNER, { ...ADMIN, role: 'OWNER' }],
        me: OWNER.userId,
        callerRole: 'OWNER',
      });

      await page.getByRole('button', { name: 'Leave workspace' }).click();

      await expect.element(page.getByRole('alertdialog')).toBeVisible();
      expect(
        page.getByText('No one else owns this workspace', { exact: false }).elements(),
      ).toHaveLength(0);
    });
  });
});
