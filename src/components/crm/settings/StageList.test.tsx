// The probability column's place is the styles'.
import '@/styles/global.css';
import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
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

/**
 * Finds a stage's pill.
 * @param name The stage's name.
 * @returns The pill.
 */
const pillOf = (name: string) =>
  [...document.querySelectorAll('[data-stage-name]')]
    .find((node) => node.textContent === name)
    ?.closest<HTMLElement>('[data-tone]');

/**
 * Where a text ends on screen, to line up a column.
 * @param text The text.
 * @returns Its box's right edge, in whole pixels.
 */
const right = (text: string) =>
  Math.round(page.getByText(text, { exact: true }).element().getBoundingClientRect().right);

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

  it('stops saying it saves, and says the server was not reached, when the action throws', async () => {
    const rejections: unknown[] = [];
    const record = (event: PromiseRejectionEvent) => {
      rejections.push(event.reason);
    };
    window.addEventListener('unhandledrejection', record);
    await renderList(vi.fn<Reorder>().mockRejectedValue(new TypeError('Failed to fetch')));

    await page.getByRole('button', { name: 'Move Qualified up' }).click();

    await expect
      .element(page.getByText("Couldn't reach the server. Check your connection and try again."))
      .toBeVisible();
    expect(page.getByText('Saving the order…').elements()).toHaveLength(0);
    await expect
      .element(page.getByRole('button', { name: 'Move Qualified up' }))
      .not.toHaveAttribute('aria-disabled');
    // Handled: nothing is left to surface as an unhandled rejection.
    expect(rejections).toStrictEqual([]);
    window.removeEventListener('unhandledrejection', record);
  });

  it("draws each stage's name in its colour's pill: open ones blue to amber, Won green, Lost red", async () => {
    await renderList(vi.fn<Reorder>());

    expect(
      ['New', 'Qualified', 'Proposal', 'Won', 'Lost'].map((name) => pillOf(name)?.dataset.tone),
    ).toStrictEqual(['blue', 'violet', 'amber', 'green', 'red']);
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

  it("lines up every stage's probability in one column, Won's and Lost's too", async () => {
    await page.viewport(1280, 800);
    await renderList(vi.fn<Reorder>());
    expect(right('100%')).toBe(right('10%'));
    expect(right('0%')).toBe(right('60%'));
  });

  it('shows the pipeline without controls to a member who cannot change it', async () => {
    await renderList(vi.fn<Reorder>(), false);

    expect(shownOrder()).toStrictEqual(['New', 'Qualified', 'Proposal', 'Won', 'Lost']);
    expect(page.getByRole('button').elements()).toHaveLength(0);
  });

  it('gives the focus to the heading after a delete, whatever characters its id has', async () => {
    // A useId() id, as React writes it: not a valid CSS selector as it stands.
    const headingId = ':r1:';
    const Pipeline = () => {
      const [stages, setStages] = useState(STAGES);

      return (
        <section>
          <h2 id={headingId} tabIndex={-1}>
            Pipeline
          </h2>
          <StageList
            stages={stages}
            canManage
            headingId={headingId}
            actions={{
              create: done,
              update: done,
              reorder: vi.fn<Reorder>(),
              remove: async (stageId) => {
                setStages((current) => current.filter((stage) => stage.id !== stageId));
                return await Promise.resolve({ ok: true });
              },
            }}
          />
        </section>
      );
    };
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <Pipeline />
      </NextIntlClientProvider>,
    );

    await page.getByRole('button', { name: 'Delete Qualified' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete stage' }).click();

    await expect
      .element(page.getByRole('button', { name: 'Delete Qualified' }))
      .not.toBeInTheDocument();
    await expect.element(page.getByRole('heading', { name: 'Pipeline' })).toHaveFocus();
  });

  it('clears the add form each time a stage is saved, ready for the next one', async () => {
    done.mockClear();
    await renderList(vi.fn<Reorder>());
    const name = page.getByLabelText('Stage name');
    const probability = page.getByLabelText('Win probability (%)');

    await name.fill('Demo');
    await probability.fill('40');
    await page.getByRole('button', { name: 'Add stage' }).click();

    await expect.element(name).toHaveValue('');
    // Back to the add form's own starting probability.
    await expect.element(probability).toHaveValue(50);
    expect(done).toHaveBeenLastCalledWith({ name: 'Demo', probability: 40 });

    await name.fill('Review');
    await page.getByRole('button', { name: 'Add stage' }).click();

    await expect.element(name).toHaveValue('');
    expect(done).toHaveBeenLastCalledWith({ name: 'Review', probability: 50 });
  });
});
