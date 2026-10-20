import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { PASSWORD, signIn, signUp } from '../helpers';
import type { Member } from './helpers';
import {
  addMember,
  apiCall,
  column,
  createWorkspace,
  drag,
  dragAndSave,
  expectNoA11yViolations,
  expectNoSidewaysScroll,
  handleOf,
  seed,
  seedWorkspace,
  stageOf,
  stagesOf,
  untilSaved,
  waitForHydration,
} from './helpers';

// The default pipeline's six columns fit the content column of a 1440 px screen, in one frame.
test.use({ viewport: { width: 1440, height: 900 } });

/**
 * Opens the board, signed in as `member`, once its cards can be dragged.
 * @param page Playwright page.
 * @param member Who signs in.
 * @param deal A deal on the board, which is waited for.
 */
const openBoard = async (page: Page, member: Member, deal: string) => {
  await signIn(page, { email: member.email, password: PASSWORD });
  await page.goto(`${member.path}/deals`);
  await expect(page.getByRole('link', { name: deal })).toBeVisible();
  await waitForHydration(page.getByRole('main'));
};

/**
 * Seeds a workspace with an owner, a manager who owns "Acme seats" (1,250.00 euros, in the
 * first stage unless told otherwise), and Acme Trading.
 * @param request Playwright API client.
 * @param stage The stage the deal starts in.
 * @returns The people, the deal and the stages.
 */
const seedBoard = async (request: APIRequestContext, stage = 'Qualification') => {
  const owner = await seedWorkspace(request, { owner: 'Olivia Owner' });
  const mia = await addMember(request, owner, 'MANAGER', 'Mia Manager');
  const company = await seed(request, owner, 'companies', { name: 'Acme Trading' });
  const stages = await stagesOf(request, owner);
  const deal = await seed(request, mia, 'deals', {
    name: 'Acme seats',
    amount: '1250.00',
    companyId: company.id,
    stageId: stages.find((item) => item.name === stage)?.id,
  });

  return { owner, mia, deal, stages };
};

test.describe('Pipeline', () => {
  test('shows every stage, and moves a deal by dragging it, signed in its history', async ({
    page,
    request,
  }) => {
    const { owner } = await seedBoard(request);
    await openBoard(page, owner, 'Acme seats');

    await expect(page.getByRole('heading', { level: 2 })).toHaveText([
      'Qualification',
      'Needs analysis',
      'Proposal',
      'Negotiation',
      'Won',
      'Lost',
    ]);
    await expect(column(page, 'Qualification')).toContainText('1 deal');
    await expect(column(page, 'Qualification')).toContainText('€1,250.00');
    await expect(column(page, 'Needs analysis')).toContainText('No deals');
    // Won and Lost are slim: their name, count and a link to the list, no room for cards.
    await expect(column(page, 'Won')).toContainText('0 deals');
    await expect(
      column(page, 'Lost').getByRole('link', { name: 'View in list: Lost' }),
    ).toBeVisible();
    const won = await column(page, 'Won').boundingBox();
    expect(won?.width).toBeLessThan(100);
    // Nothing to scroll to: all six fit, so the edge fade is off and the page doesn't scroll.
    const board = await column(page, 'Qualification')
      .locator('..')
      .evaluate((node) => ({
        fits: node.scrollWidth <= node.clientWidth,
        fade: getComputedStyle(node.querySelector('.scroll-fade') ?? node).opacity,
        page: document.documentElement.scrollWidth <= window.innerWidth,
      }));
    expect(board).toStrictEqual({ fits: true, fade: '0', page: true });
    await expectNoA11yViolations(page);

    await dragAndSave(page, handleOf(page, 'Acme seats'), column(page, 'Needs analysis'));
    await expect(
      column(page, 'Needs analysis').getByRole('link', { name: 'Acme seats' }),
    ).toBeVisible();
    await expect(column(page, 'Qualification')).toContainText('No deals');

    // It stays there, and the counts and totals are the server's.
    await page.reload();
    await expect(column(page, 'Needs analysis')).toContainText('1 deal');
    await expect(column(page, 'Needs analysis')).toContainText('€1,250.00');
    await expect(column(page, 'Qualification')).toContainText('No deals');
    await waitForHydration(page.getByRole('main'));
    await dragAndSave(page, handleOf(page, 'Acme seats'), column(page, 'Proposal'));
    await expect(column(page, 'Proposal').getByRole('link', { name: 'Acme seats' })).toBeVisible();

    // The history holds both moves, each by Olivia, and the creation by Mia; the row is signed
    // by whoever moved the deal into each stage, the open one by nobody yet.
    await page.reload();
    await page.getByRole('link', { name: 'Acme seats' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Acme seats' })).toBeVisible();
    const history = page.getByRole('region', { name: 'Stage history' });
    await expect(history.getByRole('listitem')).toHaveCount(3);
    await expect(history.getByRole('listitem').nth(0)).toContainText('Needs analysis');
    await expect(history.getByRole('listitem').nth(0)).toContainText('Proposal');
    await expect(history.getByRole('listitem').nth(0)).toContainText('Olivia Owner');
    await expect(history.getByRole('listitem').nth(1)).toContainText('Qualification');
    await expect(history.getByRole('listitem').nth(1)).toContainText('Needs analysis');
    await expect(history.getByRole('listitem').nth(1)).toContainText('Olivia Owner');
    await expect(history.getByRole('listitem').nth(2)).toContainText('Created in Qualification');
    await expect(history.getByRole('listitem').nth(2)).toContainText('Mia Manager');
    const row = page.getByRole('list', { name: 'Deal progress' });
    await expect(row.getByText('Qualification: reached, moved here by Mia Manager')).toBeVisible();
    await expect(
      row.getByText('Needs analysis: reached, moved here by Olivia Owner'),
    ).toBeVisible();
    await expect(row.getByText('Proposal: current, 0 days')).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test('moves a deal from the keyboard and from its menu', async ({ page, request }) => {
    const { owner } = await seedBoard(request);
    await openBoard(page, owner, 'Acme seats');
    const announced = page.locator('[id^="DndLiveRegion"]');

    // Space picks it up, the arrow crosses to the next stage, Space drops it; each step is
    // announced, and the focus stays on the card's handle.
    const handle = handleOf(page, 'Acme seats');
    await handle.focus();
    await page.keyboard.press('Space');
    await expect(announced).toHaveText('Acme seats is over Qualification.');
    // dnd-kit starts listening for the arrow keys a moment after it announces the pick-up, and an
    // arrow pressed before moves nothing: press again until the card is over the next stage.
    await expect(async () => {
      await page.keyboard.press('ArrowRight');
      await expect(announced).toHaveText('Acme seats is over Needs analysis.', { timeout: 1000 });
    }).toPass({ timeout: 10_000 });
    await page.keyboard.press('Space');
    await expect(announced).toHaveText('Acme seats dropped on Needs analysis.');
    await expect(
      column(page, 'Needs analysis').getByRole('link', { name: 'Acme seats' }),
    ).toBeVisible();
    await expect(handle).toBeFocused();

    // "Move to…" does the same for anyone who can't drag, and says what Won means.
    await page.getByRole('button', { name: 'Actions for Acme seats' }).click();
    await page.getByRole('menuitem', { name: 'Move to…' }).click();
    const dialog = page.getByRole('dialog', { name: 'Move Acme seats' });
    await dialog.getByLabel('Stage').selectOption('Won');
    await expect(dialog.getByText('Moving it here closes the deal as won.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Move deal' }).click();
    await expect(page.getByText('Acme seats moved to Won')).toBeVisible();
    // Won is slim: it counts the deal, and the card is no longer on the board.
    await expect(column(page, 'Won')).toContainText('1 deal');
    await expect(page.getByRole('link', { name: 'Acme seats', exact: true })).toHaveCount(0);
  });

  test('moves a deal to Lost only with a reason', async ({ page, request }) => {
    const { owner, mia, deal } = await seedBoard(request, 'Negotiation');
    const second = await seed(request, mia, 'deals', { name: 'Beta rollout', amount: '800.00' });
    await openBoard(page, owner, 'Acme seats');
    const stays = column(page, 'Negotiation').locator('a', { hasText: 'Acme seats' });

    // Dropped on Lost, the card asks why and waits; cancelling moves nothing.
    await drag(page, handleOf(page, 'Acme seats'), column(page, 'Lost'));
    const dialog = page.getByRole('dialog', { name: 'Mark Acme seats as lost' });
    await expect(dialog).toBeVisible();
    await expect(stays).toBeVisible();
    await dialog.getByRole('button', { name: 'Mark as lost' }).click();
    await expect(dialog.getByText('Required')).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(stays).toBeVisible();
    await expect(column(page, 'Lost')).toContainText('No deals');
    expect(await stageOf(request, owner, deal.id)).toBe('Negotiation');

    // With a reason it moves, and the reason stays on the deal.
    await drag(page, handleOf(page, 'Acme seats'), column(page, 'Lost'));
    await dialog.getByLabel('Reason').fill('Went with a competitor');
    await untilSaved(page, async () => {
      await dialog.getByRole('button', { name: 'Mark as lost' }).click();
    });
    // Lost is slim: the card leaves the board, the column counts it and links to the list of it.
    await expect(column(page, 'Lost')).toContainText('1 deal');
    await expect(stays).toHaveCount(0);
    await page.reload();
    await expect(column(page, 'Lost')).toContainText('1 deal');
    await expect(column(page, 'Lost')).toContainText('€1,250');
    await column(page, 'Lost').getByRole('link', { name: 'View in list: Lost' }).click();
    await expect(page).toHaveURL(/view=list&stageId=\d+/u);
    await page.getByRole('link', { name: 'Acme seats' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Acme seats' })).toBeVisible();
    await expect(page.getByText('Why it was lost')).toBeVisible();
    // The fact itself: the History section below repeats it as a change.
    await expect(page.getByText('Went with a competitor', { exact: true })).toBeVisible();
    await expect(page.getByText('Lost: closed as lost')).toBeVisible();

    // The Move dialog on a deal's page asks the same.
    await page.goto(`${owner.path}/deals/${second.id}`);
    await waitForHydration(page.getByRole('main'));
    await page.getByRole('button', { name: 'Move', exact: true }).click();
    const move = page.getByRole('dialog', { name: 'Move Beta rollout' });
    await move.getByLabel('Stage').selectOption('Lost');
    await expect(move.getByText('Moving it here closes the deal as lost.')).toBeVisible();
    await move.getByRole('button', { name: 'Move deal' }).click();
    await expect(move.getByText('Required')).toBeVisible();
    expect(await stageOf(request, owner, second.id)).toBe('Qualification');
    await move.getByLabel('Reason').fill('Budget frozen');
    await move.getByRole('button', { name: 'Move deal' }).click();
    await expect(page.getByText('Beta rollout moved to Lost')).toBeVisible();
    await expect(page.getByText('Budget frozen', { exact: true })).toBeVisible();
  });

  test('cancels a drop outside every column', async ({ page, request }) => {
    const { owner, deal } = await seedBoard(request);
    await openBoard(page, owner, 'Acme seats');

    // Released over the page's heading: no column, so no move, no dialog and no message.
    await drag(page, handleOf(page, 'Acme seats'), page.getByRole('heading', { level: 1 }));
    // The drag did start, and ended over nothing.
    await expect(page.locator('[id^="DndLiveRegion"]')).toHaveText(
      'Moving Acme seats was cancelled.',
    );
    await expect(
      column(page, 'Qualification').getByRole('link', { name: 'Acme seats' }),
    ).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
    await page.reload();
    await expect(
      column(page, 'Qualification').getByRole('link', { name: 'Acme seats' }),
    ).toBeVisible();
    expect(await stageOf(request, owner, deal.id)).toBe('Qualification');
  });

  test('gives a sales rep no way to move another rep’s deal, and refuses a forged move', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: 'Olivia Owner' });
    const riley = await addMember(request, owner, 'SALES_REP', 'Riley Rep');
    const ravi = await addMember(request, owner, 'SALES_REP', 'Ravi Rep');
    const mine = await seed(request, riley, 'deals', { name: 'Riley deal', amount: '300.00' });
    const theirs = await seed(request, ravi, 'deals', { name: 'Ravi deal', amount: '900.00' });
    await openBoard(page, riley, 'Ravi deal');

    // Both are on the board, but only the rep's own has a handle and a menu.
    await expect(handleOf(page, 'Riley deal')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Actions for Riley deal' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Drag D-\d+ /u })).toHaveCount(1);
    await expect(page.getByRole('button', { name: /^Actions for /u })).toHaveCount(1);
    // Nor does its page offer to move, edit or archive it.
    await page.getByRole('link', { name: 'Ravi deal' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Ravi deal' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Move', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Edit', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Archive', exact: true })).toHaveCount(0);

    // The rep moves their own deal in the UI, but the request names the other rep's deal: the
    // action is the real one, only the id in its body is swapped on the way to the server.
    await page.goto(`${riley.path}/deals`);
    await waitForHydration(page.getByRole('main'));
    const named: number[] = [];
    await page.route(/\/deals$/u, async (route) => {
      const sent = route.request();
      const body = sent.postData();
      if (sent.method() !== 'POST' || !sent.headers()['next-action'] || !body) {
        await route.continue();
        return;
      }
      const [workspaceId, dealId, input]: [number, number, unknown] = JSON.parse(body);
      named.push(dealId);
      await route.continue({ postData: JSON.stringify([workspaceId, theirs.id, input]) });
    });
    await dragAndSave(page, handleOf(page, 'Riley deal'), column(page, 'Needs analysis'));

    // The refusal, in the rep's language, and the card goes back where it was.
    await expect(page.getByText("Your role doesn't allow this.")).toBeVisible();
    expect(named).toEqual([mine.id]);
    await expect(
      column(page, 'Qualification').getByRole('link', { name: 'Riley deal' }),
    ).toBeVisible();
    await expect(
      column(page, 'Qualification').getByRole('link', { name: 'Ravi deal' }),
    ).toBeVisible();
    await expect(column(page, 'Needs analysis')).toContainText('No deals');

    // Nothing moved on the server either: not the other rep's deal, not their own.
    await page.unroute(/\/deals$/u);
    await page.reload();
    await expect(
      column(page, 'Qualification').getByRole('link', { name: 'Ravi deal' }),
    ).toBeVisible();
    await expect(column(page, 'Needs analysis')).toContainText('No deals');
    expect(await stageOf(request, owner, theirs.id)).toBe('Qualification');
    expect(await stageOf(request, owner, mine.id)).toBe('Qualification');
  });

  test('filters the deal list by its lead source', async ({ page, request }) => {
    const { owner, mia } = await seedBoard(request);
    const source = await apiCall<{ id: number }>(
      request,
      owner,
      'POST',
      `/workspaces/${owner.workspaceId}/lead-sources`,
      { name: 'Trade show' },
    );
    await seed(request, mia, 'deals', { name: 'Show deal', amount: '500.00', sourceId: source.id });
    await signIn(page, { email: owner.email, password: PASSWORD });
    await page.goto(`${owner.path}/deals?view=list`);
    await expect(page.getByRole('heading', { name: '2 deals' })).toBeVisible();
    await waitForHydration(page.getByRole('main'));

    await page.getByRole('combobox', { name: 'Source' }).click();
    await page.getByRole('option', { name: 'Trade show' }).click();

    await expect(page.getByRole('heading', { name: '1 deal', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Show deal' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Acme seats' })).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`sourceId=${source.id}`, 'u'));
  });

  test('shows a member of another workspace "Workspace not found" for a deal’s URL', async ({
    page,
    request,
  }) => {
    const { owner, deal } = await seedBoard(request);
    await signUp(page);
    await createWorkspace(page, 'Elsewhere');

    await page.goto(`${owner.path}/deals/${deal.id}`);

    await expect(
      page.getByRole('heading', { name: "Workspace not found or you're not a member" }),
    ).toBeVisible();
    await expect(page.getByText('Acme seats')).toHaveCount(0);
  });

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('moves a deal from its menu, one stage at a time', async ({ page, request }) => {
      const { owner } = await seedBoard(request);
      await openBoard(page, owner, 'Acme seats');

      // One column shows, chosen with a select; there is no handle, the menu moves the card.
      await expect(page.getByLabel('Stage shown')).toHaveValue(/\d+/u);
      await expect(page.getByRole('button', { name: /^Drag D-/u })).toBeHidden();
      await page.getByRole('button', { name: 'Actions for Acme seats' }).click();
      await page.getByRole('menuitem', { name: 'Move to…' }).click();
      const dialog = page.getByRole('dialog', { name: 'Move Acme seats' });
      await dialog.getByLabel('Stage').selectOption('Needs analysis');
      await dialog.getByRole('button', { name: 'Move deal' }).click();
      await expect(page.getByText('Acme seats moved to Needs analysis')).toBeVisible();
      await page.getByLabel('Stage shown').selectOption({ label: 'Needs analysis (1)' });
      await expect(page.getByRole('link', { name: 'Acme seats' })).toBeVisible();
    });

    test('fits the board and the deal list without sideways scrolling, in Thai', async ({
      page,
      request,
    }) => {
      const { owner, mia } = await seedBoard(request);
      const name = 'ข้อตกลงการจัดซื้อซอฟต์แวร์บริหารจัดการลูกค้าสัมพันธ์สำหรับองค์กรขนาดใหญ่';
      await seed(request, mia, 'deals', { name, amount: '9999999999.99', currency: 'THB' });
      await signIn(page, { email: owner.email, password: PASSWORD });
      const thai = owner.path.replace('/app/', '/th/app/');

      await expectNoSidewaysScroll(page, `${thai}/deals`);
      await expect(page.getByRole('link', { name })).toBeVisible();
      await expectNoSidewaysScroll(page, `${thai}/deals?view=list`);
    });
  });
});
