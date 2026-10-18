import type { APIRequestContext, Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { PASSWORD, signIn, signUp } from '../helpers';
import type { Member } from './helpers';
import {
  addMember,
  apiCall,
  createWorkspace,
  expectNoA11yViolations,
  expectNoSidewaysScroll,
  seed,
  seedWorkspace,
  stagesOf,
  waitForHydration,
} from './helpers';

// The board is as wide as its six columns and scrolls inside the page: the first three show.
test.use({ viewport: { width: 1440, height: 900 } });

/**
 * A stage's column, found by its markup so it is still found while a dialog hides the page
 * from the accessibility tree.
 * @param page Playwright page, on the board.
 * @param stage The stage's name.
 * @returns The column.
 */
const column = (page: Page, stage: string) =>
  page.locator('section[aria-labelledby^="board-stage-"]', {
    has: page.locator(`h2:text-is("${stage}")`),
  });

/**
 * A pointer drag, in steps: dnd-kit's sensor needs the pointer to travel (a straight
 * `dragTo` is over before it has measured anything).
 * @param page Playwright page.
 * @param handle The card's drag handle.
 * @param target Where to drop: its middle, a little down, which is over a column's cards.
 */
const drag = async (page: Page, handle: Locator, target: Locator) => {
  const from = await handle.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) {
    throw new Error('Nothing to drag, or nowhere to drop it');
  }
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + 20, from.y + 20, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + 120, { steps: 15 });
  await page.mouse.up();
};

/**
 * Runs something that sends a server action, and waits until the server has answered it (a
 * reload before then would cancel the request).
 * @param page Playwright page.
 * @param send What sends the action.
 */
const untilSaved = async (page: Page, send: () => Promise<void>) => {
  const answered = page.waitForResponse((response) => {
    const sent = response.request();

    return sent.method() === 'POST' && sent.headers()['next-action'] !== undefined;
  });
  await send();
  await answered;
};

/**
 * A drag that moves the deal, until the server has answered.
 * @param page Playwright page.
 * @param handle The card's drag handle.
 * @param target The column to drop on.
 */
const dragAndSave = async (page: Page, handle: Locator, target: Locator) => {
  await untilSaved(page, async () => {
    await drag(page, handle, target);
  });
};

/**
 * Scrolls the board to its last columns, so a card of a late stage can be dropped on Lost.
 * @param page Playwright page, on the board.
 */
const scrollToLast = async (page: Page) => {
  await column(page, 'Lost')
    .locator('..')
    .evaluate((board) => {
      board.scrollLeft = board.scrollWidth;
    });
};

/**
 * The drag handle of a deal's card.
 * @param page Playwright page, on the board.
 * @param name The deal's name.
 * @returns The handle.
 */
const handleOf = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^Drag D-\\d+ ${name}$`, 'u') });

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
 * Through the API: the stage a deal is in.
 * @param request Playwright API client.
 * @param as A member.
 * @param deal The deal's id.
 * @returns The stage's name.
 */
const stageOf = async (request: APIRequestContext, as: Member, deal: number) => {
  const found = await apiCall<{ stage: { name: string } }>(
    request,
    as,
    'GET',
    `/workspaces/${as.workspaceId}/deals/${deal}`,
  );

  return found.stage.name;
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
    await expect(history.getByRole('listitem').nth(2)).toContainText('Created in Qualification');
    await expect(history.getByRole('listitem').nth(2)).toContainText('Mia Manager');
    const row = page.getByRole('list', { name: 'Deal progress' });
    await expect(row.getByText('Qualification: reached, signed by Mia Manager')).toBeAttached();
    await expect(row.getByText('Needs analysis: reached, signed by Olivia Owner')).toBeAttached();
    await expect(row.getByText('Proposal: current, 0 days')).toBeAttached();
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
    // dnd-kit starts listening for the arrow keys on the next tick after it announces the pick-up.
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowRight');
    await expect(announced).toHaveText('Acme seats is over Needs analysis.');
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
    await expect(column(page, 'Won').getByRole('link', { name: 'Acme seats' })).toBeVisible();
  });

  test('moves a deal to Lost only with a reason', async ({ page, request }) => {
    const { owner, mia, deal } = await seedBoard(request, 'Negotiation');
    const second = await seed(request, mia, 'deals', { name: 'Beta rollout', amount: '800.00' });
    await openBoard(page, owner, 'Acme seats');
    await scrollToLast(page);
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
    await expect(column(page, 'Lost').getByRole('link', { name: 'Acme seats' })).toBeVisible();
    await page.reload();
    await expect(column(page, 'Lost').getByRole('link', { name: 'Acme seats' })).toBeVisible();
    await page.getByRole('link', { name: 'Acme seats' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Acme seats' })).toBeVisible();
    await expect(page.getByText('Why it was lost')).toBeVisible();
    await expect(page.getByText('Went with a competitor')).toBeVisible();
    await expect(page.getByText('Lost: closed as lost')).toBeAttached();

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
    await expect(page.getByText('Budget frozen')).toBeVisible();
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
