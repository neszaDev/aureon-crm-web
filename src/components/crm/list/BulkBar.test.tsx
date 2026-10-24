import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { assignDeal, moveDeal } from '@/actions/crm/DealActions';
import * as DealActions from '@/actions/crm/DealActions';
import type { changeLeadStatus } from '@/actions/crm/LeadActions';
import * as LeadActions from '@/actions/crm/LeadActions';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { ActionResult } from '@/libs/api/ApiError';
import type { components } from '@/libs/api/schema';
import type { BulkEntity, BulkItem } from '@/libs/crm/BulkSelection';
import messages from '@/locales/en.json';
import { BulkBar } from './BulkBar';

type Send = () => Promise<ActionResult>;

const refresh = vi.fn<() => void>();
// @ts-expect-error -- only what the bar uses
vi.mock(import('@/libs/I18nNavigation'), () => ({ useRouter: () => ({ refresh }) }));
vi.mock(import('@/actions/crm/DealActions'), () => ({
  assignDeal: vi.fn<typeof assignDeal>(),
  moveDeal: vi.fn<typeof moveDeal>(),
  archiveDeal: vi.fn<Send>(),
  restoreDeal: vi.fn<Send>(),
}));
vi.mock(import('@/actions/crm/LeadActions'), () => ({
  changeLeadStatus: vi.fn<typeof changeLeadStatus>(),
  assignLead: vi.fn<Send>(),
  archiveLead: vi.fn<Send>(),
  restoreLead: vi.fn<Send>(),
}));
// What the other lists' bars send, which these tests don't.
vi.mock(import('@/actions/crm/CompanyActions'), () => ({
  assignCompany: vi.fn<Send>(),
  archiveCompany: vi.fn<Send>(),
  restoreCompany: vi.fn<Send>(),
}));
vi.mock(import('@/actions/crm/ContactActions'), () => ({
  assignContact: vi.fn<Send>(),
  archiveContact: vi.fn<Send>(),
  restoreContact: vi.fn<Send>(),
}));
vi.mock(import('@/actions/crm/TaskActions'), () => ({
  assignTask: vi.fn<Send>(),
  completeTask: vi.fn<Send>(),
  reopenTask: vi.fn<Send>(),
  cancelTask: vi.fn<Send>(),
}));

const MIA: components['schemas']['MemberResponse'] = {
  userId: 2,
  email: 'mia@acme.test',
  displayName: 'Mia Rossi',
  role: 'MANAGER',
  joinedAt: '2026-01-01T00:00:00Z',
};
const STAGES = [
  { id: 1, name: 'Prospecting', kind: 'OPEN' as const },
  { id: 2, name: 'Won', kind: 'WON' as const },
  { id: 3, name: 'Lost', kind: 'LOST' as const },
];
const item = (id: number, name: string, extra: Partial<BulkItem> = {}): BulkItem => ({
  id,
  name,
  version: id * 10,
  ownerId: 1,
  mayEdit: true,
  ...extra,
});

const renderBar = async (
  entity: BulkEntity,
  chosen: BulkItem[],
  options: { mayAssign?: boolean; archived?: boolean } = {},
) => {
  const onClear = vi.fn<() => void>();
  const onKeep = vi.fn<(ids: number[]) => void>();
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <TooltipProvider>
        <h2 id="list-heading" tabIndex={-1}>
          List
        </h2>
        <BulkBar
          entity={entity}
          workspaceId={1}
          members={[MIA]}
          mayAssign={options.mayAssign ?? true}
          archived={options.archived ?? false}
          stages={STAGES}
          headingId="list-heading"
          chosen={chosen}
          onClear={onClear}
          onKeep={onKeep}
        />
      </TooltipProvider>
      <Toaster />
    </NextIntlClientProvider>,
  );

  return { onClear, onKeep };
};

const bar = () => page.getByRole('toolbar');
const buttonsOf = () =>
  bar()
    .getByRole('button')
    .elements()
    .map((button) => button.getAttribute('aria-label') ?? button.textContent);

describe(BulkBar, () => {
  beforeEach(() => {
    vi.mocked(DealActions.moveDeal).mockReset().mockResolvedValue({ ok: true });
    vi.mocked(DealActions.assignDeal).mockReset().mockResolvedValue({ ok: true });
    vi.mocked(LeadActions.changeLeadStatus).mockReset().mockResolvedValue({ ok: true });
    refresh.mockReset();
  });

  describe('gating', () => {
    it('offers assign, the stage menu, archive and clear for records the caller may change', async () => {
      await renderBar('deal', [item(1, 'Fleet tablets'), item(2, 'Depot rollout')]);

      await expect.element(bar()).toHaveAccessibleName('2 selected');
      expect(buttonsOf()).toStrictEqual(['Assign', 'Stage', 'Archive', 'Clear selection']);
    });

    it('offers only clear, and says why, when one record is not the caller’s to change', async () => {
      await renderBar('lead', [item(1, 'Amara'), item(2, 'Bruno', { mayEdit: false })]);

      expect(buttonsOf()).toStrictEqual(['Clear selection']);
      await expect.element(bar()).toHaveTextContent("1 of these isn't yours to change");
    });

    it('leaves out assign without the right to give records to others', async () => {
      await renderBar('company', [item(1, 'Acme')], { mayAssign: false });

      expect(buttonsOf()).toStrictEqual(['Archive', 'Clear selection']);
    });

    it('offers only restore in the archive', async () => {
      await renderBar('contact', [item(1, 'Ana')], { archived: true });

      expect(buttonsOf()).toStrictEqual(['Restore', 'Clear selection']);
    });

    it('keeps a converted lead to archive alone', async () => {
      await renderBar('lead', [item(1, 'Amara', { state: 'CONVERTED' }), item(2, 'Bruno')]);

      expect(buttonsOf()).toStrictEqual(['Archive', 'Clear selection']);
    });

    it('offers the task moves every selected task can take', async () => {
      await renderBar('task', [item(1, 'Call', { state: 'OPEN' })]);
      await bar().getByRole('button', { name: 'Status' }).click();

      expect(
        page
          .getByRole('menuitem')
          .elements()
          .map((entry) => entry.textContent),
      ).toStrictEqual(['Complete', 'Cancel…']);
    });

    it('offers no status for open and closed tasks together', async () => {
      await renderBar('task', [
        item(1, 'Call', { state: 'OPEN' }),
        item(2, 'Mail', { state: 'COMPLETED' }),
      ]);

      expect(buttonsOf()).toStrictEqual(['Assign', 'Clear selection']);
    });

    it('offers reopen for completed and cancelled tasks', async () => {
      await renderBar('task', [
        item(2, 'Mail', { state: 'COMPLETED' }),
        item(3, 'Visit', { state: 'CANCELLED' }),
      ]);
      await bar().getByRole('button', { name: 'Status' }).click();

      expect(
        page
          .getByRole('menuitem')
          .elements()
          .map((entry) => entry.textContent),
      ).toStrictEqual(['Reopen']);
    });
  });

  describe('keyboard', () => {
    it('takes one Tab stop, and the arrow keys move between its controls', async () => {
      await renderBar('deal', [item(1, 'Fleet tablets'), item(2, 'Depot rollout')]);
      const button = (name: string) => bar().getByRole('button', { name, exact: true });

      // The toolbar is the stop, and hands the focus to its first control.
      await expect.element(bar()).toHaveAttribute('tabindex', '0');
      expect(
        bar()
          .getByRole('button')
          .elements()
          .map((control) => control.getAttribute('tabindex')),
      ).toStrictEqual(['-1', '-1', '-1', '-1']);
      const toolbar = bar().element();
      if (toolbar instanceof HTMLElement) {
        toolbar.focus();
      }
      await expect.element(button('Assign')).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      await expect.element(button('Stage')).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      await expect.element(button('Archive')).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      await expect.element(button('Clear selection')).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      await expect.element(button('Assign')).toHaveFocus();
    });
  });

  describe('running', () => {
    it('asks for the lost reason once and sends it with every deal', async () => {
      const { onClear } = await renderBar('deal', [
        item(1, 'Fleet tablets', { state: '1' }),
        item(2, 'Depot rollout', { state: '1' }),
      ]);

      await bar().getByRole('button', { name: 'Stage' }).click();
      await page.getByRole('menuitem', { name: 'Lost' }).click();
      const dialog = page.getByRole('dialog', { name: 'Mark 2 deals as lost' });
      await dialog.getByRole('textbox', { name: 'Reason' }).fill('Went with a competitor');
      await dialog.getByRole('button', { name: 'Mark as lost' }).click();

      await expect.element(page.getByText('2 deals moved to Lost')).toBeVisible();
      expect(DealActions.moveDeal).toHaveBeenCalledTimes(2);
      // Each without its own page refresh: the bar refreshes once, after the last answer.
      expect(DealActions.moveDeal).toHaveBeenCalledWith(
        1,
        1,
        { stageId: 3, version: 10, lostReason: 'Went with a competitor' },
        false,
      );
      expect(DealActions.moveDeal).toHaveBeenCalledWith(
        1,
        2,
        { stageId: 3, version: 20, lostReason: 'Went with a competitor' },
        false,
      );
      expect(onClear).toHaveBeenCalledOnce();
      expect(refresh).toHaveBeenCalledOnce();
    });

    it('lists each refused record by name with its reason, keeps them selected, and refreshes', async () => {
      vi.mocked(DealActions.moveDeal).mockImplementation(
        async (_workspace, id) =>
          await Promise.resolve(
            id === 2
              ? { ok: false, message: 'Someone else changed this. Reload to see their version.' }
              : { ok: true },
          ),
      );
      const { onClear, onKeep } = await renderBar('deal', [
        item(1, 'Fleet tablets', { state: '1' }),
        item(2, 'Depot rollout', { state: '1' }),
        item(3, 'US expansion', { state: '1' }),
      ]);

      await bar().getByRole('button', { name: 'Stage' }).click();
      await page.getByRole('menuitem', { name: 'Won' }).click();

      const alert = page.getByRole('alert');
      await expect.element(alert).toHaveTextContent("1 of 3 wasn't changed");
      const refusal = alert.getByRole('listitem');
      await expect.element(refusal.getByText('Depot rollout')).toBeVisible();
      await expect
        .element(refusal.getByText('Someone else changed this. Reload to see their version.'))
        .toBeVisible();
      expect(onKeep).toHaveBeenCalledWith([2]);
      expect(onClear).not.toHaveBeenCalled();
      expect(refresh).toHaveBeenCalledOnce();
    });

    it('says in words why each record was refused: changed meanwhile, or a value refused', async () => {
      vi.mocked(DealActions.moveDeal).mockImplementation(
        async (_workspace, id) =>
          await Promise.resolve(
            id === 1
              ? {
                  ok: false,
                  message: 'Someone else changed this. Reload to see their version.',
                  conflict: true,
                }
              : {
                  ok: false,
                  message: 'Check the highlighted fields and try again.',
                  fieldErrors: { lostReason: 'size must be between 0 and 1000' },
                },
          ),
      );
      await renderBar('deal', [item(1, 'Fleet tablets'), item(2, 'Depot rollout')]);

      await bar().getByRole('button', { name: 'Stage' }).click();
      await page.getByRole('menuitem', { name: 'Won' }).click();

      const alert = page.getByRole('alert');
      await expect
        .element(alert.getByRole('listitem').filter({ hasText: 'Fleet tablets' }))
        .toHaveTextContent('Someone changed this meanwhile; the list shows it now.');
      await expect
        .element(alert.getByRole('listitem').filter({ hasText: 'Depot rollout' }))
        .toHaveTextContent("Something in the request isn't valid. Check it and try again.");
      expect(alert.element().textContent).not.toContain('highlighted');
    });

    it('sends every record, those the list shows already there too: the server has the last word', async () => {
      await renderBar('deal', [
        item(1, 'Fleet tablets', { state: '1' }),
        item(2, 'Depot rollout', { state: '2' }),
      ]);

      await bar().getByRole('button', { name: 'Stage' }).click();
      await page.getByRole('menuitem', { name: 'Won' }).click();

      await expect.element(page.getByText('2 deals moved to Won')).toBeVisible();
      expect(DealActions.moveDeal).toHaveBeenCalledTimes(2);
      expect(DealActions.moveDeal).toHaveBeenCalledWith(
        1,
        2,
        { stageId: 2, version: 20, lostReason: undefined },
        false,
      );
    });

    it('assigns a record the list shows as the member’s already', async () => {
      await renderBar('deal', [item(1, 'Fleet tablets', { ownerId: 2 })]);
      await bar().getByRole('button', { name: 'Assign' }).click();
      await page.getByRole('menuitem', { name: 'Mia Rossi' }).click();
      await expect.element(page.getByText('1 deal assigned to Mia Rossi')).toBeVisible();
      expect(DealActions.assignDeal).toHaveBeenCalledWith(1, 1, 10, 2, false);
    });

    it('assigns every deal to the member chosen, at the version the list read', async () => {
      await renderBar('deal', [item(1, 'Fleet tablets'), item(2, 'Depot rollout')]);

      await bar().getByRole('button', { name: 'Assign' }).click();
      await page.getByRole('menuitem', { name: 'Mia Rossi' }).click();

      await expect.element(page.getByText('2 deals assigned to Mia Rossi')).toBeVisible();
      expect(DealActions.assignDeal).toHaveBeenCalledWith(1, 1, 10, 2, false);
      expect(DealActions.assignDeal).toHaveBeenCalledWith(1, 2, 20, 2, false);
      expect(refresh).toHaveBeenCalledOnce();
    });

    it('says how far it got while the records are on their way', async () => {
      const answer = Promise.withResolvers<ActionResult>();
      vi.mocked(LeadActions.changeLeadStatus).mockReturnValue(answer.promise);
      await renderBar('lead', [item(1, 'Amara', { state: 'NEW' })]);

      await bar().getByRole('button', { name: 'Status' }).click();
      await page.getByRole('menuitem', { name: 'Qualified', exact: true }).click();

      await expect.element(bar()).toHaveTextContent('Updating 0 of 1');
      answer.resolve({ ok: true });
      await expect.element(page.getByText('1 lead moved to Qualified')).toBeVisible();
    });

    it('opens no menu while records are on their way', async () => {
      const answer = Promise.withResolvers<ActionResult>();
      vi.mocked(LeadActions.changeLeadStatus).mockReturnValue(answer.promise);
      await renderBar('lead', [item(1, 'Amara', { state: 'NEW' })]);
      await bar().getByRole('button', { name: 'Status' }).click();
      await page.getByRole('menuitem', { name: 'Qualified', exact: true }).click();
      await expect.element(bar()).toHaveTextContent('Updating 0 of 1');

      // By keyboard: the pointer can't press a control marked disabled.
      const assign = bar().getByRole('button', { name: 'Assign' }).element();
      if (assign instanceof HTMLElement) {
        assign.focus();
      }
      await userEvent.keyboard('{Enter}');

      await expect
        .element(bar().getByRole('button', { name: 'Assign' }))
        .toHaveAttribute('aria-expanded', 'false');
      expect(page.getByRole('menuitem').elements()).toHaveLength(0);
      answer.resolve({ ok: true });
      await expect.element(page.getByText('1 lead moved to Qualified')).toBeVisible();
    });

    it('clears with its button', async () => {
      const { onClear } = await renderBar('lead', [item(1, 'Amara')]);

      await userEvent.click(bar().getByRole('button', { name: 'Clear selection' }));

      expect(onClear).toHaveBeenCalledOnce();
    });
  });
});
