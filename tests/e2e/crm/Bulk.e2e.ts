import { expect, test } from '@playwright/test';
import { PASSWORD, signIn } from '../helpers';
import { MORE_COMPANIES, PEOPLE } from '../mockData';
import {
  addMember,
  apiCall,
  apiSend,
  expectNoA11yViolations,
  seed,
  seedWorkspace,
  stagesOf,
  waitForHydration,
} from './helpers';

type Deal = {
  id: number;
  name: string;
  amount: string;
  currency: string;
  version: number;
  owner?: { userId: number };
  stage: { id: number; kind: string };
  lostReason?: string;
};

// The rep's deals, in name order, and one of the owner's that sorts after them.
const MINE = ['Alder kiosks', 'Birch tablets', 'Cedar rollout', 'Dogwood renewal', 'Elm retrofit'];
const OWNERS = 'Zephyr signage';

test.describe('Bulk actions', () => {
  test('a rep moves their deals to Lost with one reason; a conflict and a lost permission are listed by name, the rest change', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    const rep = await addMember(request, owner, 'SALES_REP', PEOPLE.rep);
    const stages = await stagesOf(request, owner);
    const lost = stages.find((stage) => stage.kind === 'LOST');
    const [alder, birch, cedar, dogwood, elm] = await Promise.all(
      MINE.map(async (name) => await seed(request, rep, 'deals', { name, amount: '500.00' })),
    );
    await seed(request, owner, 'deals', { name: OWNERS, amount: '900.00' });
    const deals = `/workspaces/${owner.workspaceId}/deals`;
    await signIn(page, { email: rep.email, password: PASSWORD });

    await page.goto(`${owner.path}/deals?view=list&sort=NAME&direction=ASC`);
    await expect(page.getByRole('heading', { name: '6 deals', exact: true })).toBeVisible();
    const box = (name: string) => page.getByRole('checkbox', { name: `Select ${name}` });
    const bar = page.getByRole('toolbar');
    await waitForHydration(box(OWNERS));

    // One of the owner's with one of hers: nothing to do but clear, and the bar says why.
    await box(OWNERS).click();
    await box(MINE[0] ?? '').click();
    await expect(bar).toHaveAccessibleName('2 selected');
    await expect(bar).toContainText("1 of these isn't yours to change");
    await expect(bar.getByRole('button')).toHaveText(['']);
    await expect(bar.getByRole('button', { name: 'Clear selection' })).toBeVisible();

    // Escape clears it.
    await page.keyboard.press('Escape');
    await expect(bar).toBeHidden();
    await expect(box(OWNERS)).not.toBeChecked();

    // By keyboard: Space on a name selects its row, Shift+Space on another box the range.
    await page.getByRole('link', { name: MINE[0] ?? '' }).focus();
    await page.keyboard.press('Space');
    await box(MINE[4] ?? '').focus();
    await page.keyboard.press('Shift+Space');
    await expect(bar).toHaveAccessibleName('5 selected');
    await expect(box(OWNERS)).not.toBeChecked();

    // Meanwhile the owner takes Cedar back and edits Dogwood.
    const edit = async (id: number | undefined, change: Record<string, unknown>) => {
      const saved = await apiCall<Deal>(request, owner, 'GET', `${deals}/${id}`);
      await apiSend(request, owner, 'PUT', `${deals}/${id}`, {
        name: saved.name,
        amount: saved.amount,
        currency: saved.currency,
        ownerId: saved.owner?.userId,
        version: saved.version,
        ...change,
      });
    };
    await edit(cedar?.id, { ownerId: owner.userId });
    await edit(dogwood?.id, { notes: 'Call after the budget review' });

    // Lost asks for one reason, for all five.
    await bar.getByRole('button', { name: 'Stage' }).click();
    await page.getByRole('menuitem', { name: 'Lost', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Mark 5 deals as lost' });
    await dialog.getByRole('textbox', { name: 'Reason' }).fill('Budget frozen');
    await dialog.getByRole('button', { name: 'Mark as lost' }).click();

    // Two are named with the server's reason; the other three moved with the reason.
    const alert = page.getByRole('alert').filter({ hasText: "2 of 5 weren't changed" });
    await expect(alert).toBeVisible();
    await expect(alert.getByRole('listitem')).toHaveCount(2);
    await expect(alert.getByRole('listitem').filter({ hasText: MINE[2] ?? '' })).toBeVisible();
    await expect(alert.getByRole('listitem').filter({ hasText: MINE[3] ?? '' })).toContainText(
      'Someone changed this meanwhile; the list shows it now.',
    );
    const read = async (deal?: { id: number }) =>
      await apiCall<Deal>(request, owner, 'GET', `${deals}/${deal?.id}`);
    const [moved, refused] = await Promise.all([
      Promise.all([alder, birch, elm].map(read)),
      Promise.all([cedar, dogwood].map(read)),
    ]);
    expect(moved.map((deal) => [deal.stage.id, deal.lostReason])).toStrictEqual([
      [lost?.id, 'Budget frozen'],
      [lost?.id, 'Budget frozen'],
      [lost?.id, 'Budget frozen'],
    ]);
    expect(refused.map((deal) => deal.stage.kind)).toStrictEqual(['OPEN', 'OPEN']);

    // The list shows what the server holds: three in Lost, the refused two where they were, still
    // selected (Cedar is the owner's now).
    const lostSection = page
      .locator('[data-slot=collapsible]')
      .filter({ has: page.getByRole('button', { name: /^Stage: Lost \d/u }) });
    await expect(lostSection.getByRole('row', { name: /Select/u })).toHaveCount(3);
    await expect(bar).toHaveAccessibleName('2 selected');
    await expect(box(MINE[2] ?? '')).toBeChecked();
    await expect(box(MINE[3] ?? '')).toBeChecked();
    await expect(bar).toContainText("1 of these isn't yours to change");
    await expectNoA11yViolations(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await expectNoA11yViolations(page);
  });

  test('selects a section with its box, assigns and archives companies, and a new sort starts over', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    const mia = await addMember(request, owner, 'MANAGER', PEOPLE.manager);
    const names = MORE_COMPANIES.slice(0, 3);
    const companies = await Promise.all(
      names.map(async (name) => await seed(request, owner, 'companies', { name })),
    );
    await signIn(page, { email: owner.email, password: PASSWORD });

    await page.goto(`${owner.path}/companies`);
    const all = page.getByRole('checkbox', { name: 'Select all', exact: true });
    const box = (name: string) => page.getByRole('checkbox', { name: `Select ${name}` });
    const bar = page.getByRole('toolbar');
    await waitForHydration(all);

    // One row: the section's box is mixed; then all of it.
    await box(names[1] ?? '').click();
    await expect(all).toHaveAttribute('aria-checked', 'mixed');
    await all.click();
    await expect(all).toBeChecked();
    await expect(bar).toHaveAccessibleName('3 selected');
    // Under a short list too, the bar floats 16 px above the foot of the screen, centred over the
    // canvas (not the whole window: the rail and the sidebar are on its left).
    const [floating, canvas, height] = await Promise.all([
      bar.boundingBox(),
      page.locator('#crm-main').boundingBox(),
      page.evaluate(() => window.innerHeight),
    ]);
    expect(height - ((floating?.y ?? 0) + (floating?.height ?? 0))).toBeCloseTo(16, 0);
    expect((floating?.x ?? 0) + (floating?.width ?? 0) / 2).toBeCloseTo(
      (canvas?.x ?? 0) + (canvas?.width ?? 0) / 2,
      0,
    );
    // From the section's box, one key reaches the bar past the rows.
    await all.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(bar.getByRole('button', { name: 'Assign' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(bar.getByRole('button', { name: 'Archive' })).toBeFocused();
    await expectNoA11yViolations(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await expectNoA11yViolations(page);
    await page.emulateMedia({ colorScheme: 'light' });

    // Assigned to Mia, each through its own save: the owner column says so once the server has.
    await bar.getByRole('button', { name: 'Assign' }).click();
    await page.getByRole('menuitem', { name: PEOPLE.manager }).click();
    await expect(page.getByText(`3 companies assigned to ${PEOPLE.manager}`)).toBeVisible();
    await expect(bar).toBeHidden();
    const owners = await Promise.all(
      companies.map(
        async (company) =>
          await apiCall<{ owner?: { userId: number } }>(
            request,
            owner,
            'GET',
            `/workspaces/${owner.workspaceId}/companies/${company.id}`,
          ),
      ),
    );
    expect(owners.map((company) => company.owner?.userId)).toStrictEqual([
      mia.userId,
      mia.userId,
      mia.userId,
    ]);

    // Two archived, once confirmed.
    await box(names[0] ?? '').click();
    await box(names[2] ?? '').click();
    await bar.getByRole('button', { name: 'Archive' }).click();
    await page
      .getByRole('alertdialog', { name: 'Archive 2 companies?' })
      .getByRole('button', { name: 'Archive' })
      .click();
    await expect(page.getByText('2 companies archived')).toBeVisible();
    await expect(page.getByRole('heading', { name: '1 company', exact: true })).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(names[0] ?? '', 'u') })).toBeHidden();

    // Another sort is another list: the selection starts over.
    await box(names[1] ?? '').click();
    await expect(bar).toHaveAccessibleName('1 selected');
    await page.getByRole('link', { name: 'Name', exact: true }).click();
    await expect(page).toHaveURL(/sort=NAME&direction=DESC/u);
    await expect(bar).toBeHidden();
    await expect(box(names[1] ?? '')).not.toBeChecked();
  });
});
