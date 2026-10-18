import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ActionResult } from '@/libs/api/ApiError';
import type { Stage } from '@/libs/crm/Stages';
import messages from '@/locales/en.json';
import { StageList } from './StageList';

const STAGES: Stage[] = [
  { id: 1, name: 'New', probability: 10, kind: 'OPEN', version: 0 },
  { id: 2, name: 'Qualified', probability: 30, kind: 'OPEN', version: 0 },
  { id: 3, name: 'Proposal', probability: 60, kind: 'OPEN', version: 0 },
  { id: 4, name: 'Won', probability: 100, kind: 'WON', version: 0 },
  { id: 5, name: 'Lost', probability: 0, kind: 'LOST', version: 0 },
];

type Reorder = (stageIds: number[]) => Promise<ActionResult & { stages?: Stage[] }>;

const done = vi.fn<() => Promise<ActionResult>>().mockResolvedValue({ ok: true });

const renderList = async (reorder: Reorder, canManage = true) => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <StageList
        stages={STAGES}
        canManage={canManage}
        headingId="stages-heading"
        actions={{ create: done, update: done, remove: done, reorder }}
      />
    </NextIntlClientProvider>,
  );
};

/**
 * Reads the stage names in the order the list shows them.
 * @returns The names.
 */
const shownOrder = () =>
  [...document.querySelectorAll('[data-stage-name]')].map((node) => node.textContent);

describe(StageList, () => {
  it('moves a stage with the buttons and shows the order the server saved', async () => {
    // The server's answer: the open stages in the order asked for, then Won and Lost.
    const saved = (ids: number[]) => ({
      ok: true,
      stages: [...ids, 4, 5].flatMap((id) =>
        STAGES.filter((stage) => stage.id === id).map((stage) => ({ ...stage, version: 1 })),
      ),
    });
    const reorder = vi
      .fn<Reorder>()
      .mockResolvedValueOnce(saved([2, 1, 3]))
      .mockResolvedValueOnce(saved([2, 3, 1]));
    await renderList(reorder);

    await page.getByRole('button', { name: 'Move New down' }).click();

    expect(reorder).toHaveBeenCalledWith([2, 1, 3]);
    await expect.element(page.getByText('Order saved')).toBeVisible();
    expect(shownOrder()).toStrictEqual(['Qualified', 'New', 'Proposal', 'Won', 'Lost']);

    await page.getByRole('button', { name: 'Move Proposal up' }).click();

    expect(reorder).toHaveBeenLastCalledWith([2, 3, 1]);
    await expect.poll(shownOrder).toEqual(['Qualified', 'Proposal', 'New', 'Won', 'Lost']);
  });

  it('keeps the saved order and says why when the server refuses', async () => {
    await renderList(
      vi.fn<Reorder>().mockResolvedValue({ ok: false, message: 'Your role does not allow it' }),
    );

    await page.getByRole('button', { name: 'Move Qualified up' }).click();

    await expect.element(page.getByText('Your role does not allow it')).toBeVisible();
    expect(shownOrder()).toStrictEqual(['New', 'Qualified', 'Proposal', 'Won', 'Lost']);
  });

  it('offers a reload when the pipeline changed since the page loaded', async () => {
    await renderList(
      vi.fn<Reorder>().mockResolvedValue({
        ok: false,
        conflict: true,
        message: 'The pipeline changed. Reload to see the current stages.',
      }),
    );

    await page.getByRole('button', { name: 'Move Qualified up' }).click();

    await expect
      .element(page.getByText('The pipeline changed. Reload to see the current stages.'))
      .toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Reload' })).toBeVisible();
  });

  it('stops saying it saves when the action throws', async () => {
    const failure = new Error('Network down');
    const rejections: unknown[] = [];
    // The error still surfaces (unhandled); the listener records it instead of failing the run.
    const record = (event: PromiseRejectionEvent) => {
      rejections.push(event.reason);
    };
    window.addEventListener('unhandledrejection', record);
    await renderList(vi.fn<Reorder>().mockRejectedValue(failure));

    await page.getByRole('button', { name: 'Move Qualified up' }).click();

    await expect.element(page.getByText("The order wasn't saved. Try again.")).toBeVisible();
    expect(page.getByText('Saving the order…').elements()).toHaveLength(0);
    await expect
      .element(page.getByRole('button', { name: 'Move Qualified up' }))
      .not.toHaveAttribute('aria-disabled');
    await expect.poll(() => rejections).toContain(failure);
    window.removeEventListener('unhandledrejection', record);
  });

  it('pins Won and Lost at the end, where they move and delete no more', async () => {
    const reorder = vi.fn<Reorder>();
    await renderList(reorder);

    // Dimmed (aria-disabled) buttons still take a click, which does nothing.
    await page.getByRole('button', { name: 'Move New up' }).click({ force: true });
    await page.getByRole('button', { name: 'Move Proposal down' }).click({ force: true });

    expect(reorder).not.toHaveBeenCalled();
    await expect
      .element(page.getByRole('button', { name: 'Move New up' }))
      .toHaveAttribute('aria-disabled', 'true');
    await expect.element(page.getByRole('button', { name: 'Delete Proposal' })).toBeVisible();
    expect(
      page.getByRole('button', { name: /^(Move|Delete) (Won|Lost)/u }).elements(),
    ).toHaveLength(0);
  });

  it('shows the pipeline without controls to a member who cannot change it', async () => {
    await renderList(vi.fn<Reorder>(), false);

    expect(shownOrder()).toStrictEqual(['New', 'Qualified', 'Proposal', 'Won', 'Lost']);
    expect(page.getByRole('button').elements()).toHaveLength(0);
  });
});
