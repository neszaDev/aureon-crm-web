// A row's line and height are the styles'.
import '@/styles/global.css';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { cancelTask, completeTask, reopenTask } from '@/actions/crm/TaskActions';
import * as TaskActions from '@/actions/crm/TaskActions';
import { Toaster } from '@/components/ui/sonner';
import { Table, TableBody } from '@/components/ui/table';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { components } from '@/libs/api/schema';
import messages from '@/locales/en.json';
import { TaskDue, TaskRow } from './TaskRow';

type Task = components['schemas']['TaskResponse'];

vi.mock(import('@/actions/crm/TaskActions'), () => ({
  completeTask: vi.fn<typeof completeTask>(),
  reopenTask: vi.fn<typeof reopenTask>(),
  cancelTask: vi.fn<typeof cancelTask>(),
}));

const TASK: Task = {
  id: 42,
  title: 'Send the proposal',
  priority: 'HIGH',
  status: 'OPEN',
  overdue: false,
  dueAt: '2026-10-20T02:00:00Z',
  assignee: { userId: 1, email: 'mia@acme.test', displayName: 'Mia Manager' },
  company: { id: 7, name: 'Acme' },
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  version: 3,
};

const renderRow = async (task: Task, compact?: boolean, sectioned?: boolean) => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <TooltipProvider>
        <Table>
          <TableBody>
            <TaskRow
              task={task}
              workspaceId={1}
              canEdit
              timeZone="Asia/Bangkok"
              headingId="tasks-heading"
              compact={compact}
              sectioned={sectioned}
            />
          </TableBody>
        </Table>
      </TooltipProvider>
      <Toaster />
    </NextIntlClientProvider>,
  );
};

const checkbox = () => page.getByRole('checkbox', { name: 'Complete Send the proposal' });
// A computed length in pixels, as a number.
const px = (value: string) => Number(value.replace('px', ''));
// A colour as the browser computes it (`rgb()`), to compare with an element's.
const colorOf = (value: string) => {
  const probe = document.createElement('span');
  probe.style.backgroundColor = value;
  document.body.append(probe);
  const color = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return color;
};
// Whether two texts sit on one line: their boxes' middles level.
const sameLine = (first: string, second: string) => {
  const [a, b] = [first, second].map((text) =>
    page.getByText(text, { exact: true }).first().element().getBoundingClientRect(),
  );
  return (
    a !== undefined && b !== undefined && Math.abs(a.y + a.height / 2 - (b.y + b.height / 2)) < 3
  );
};
const menu = () => page.getByRole('button', { name: 'More actions for Send the proposal' });
const pill = (status: string) => page.getByRole('button', { name: `Status: ${status}` });
// Marked while a change is on its way, so a refresh that redraws the row keeps the focus.
const used = () => document.querySelector<HTMLElement>('[data-pill="task-42"]')?.dataset.used;

// Two sections of one list: the row is drawn anew in the other once the refresh lands.
const twoSections = (task: Task, section: 'open' | 'completed') => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <h2 id="tasks-heading" tabIndex={-1}>
      Tasks
    </h2>
    {(['open', 'completed'] as const).map((key) => (
      <Table key={key}>
        <TableBody>
          {key === section && (
            <TaskRow task={task} workspaceId={1} canEdit timeZone="UTC" headingId="tasks-heading" />
          )}
        </TableBody>
      </Table>
    ))}
  </NextIntlClientProvider>
);

describe(TaskRow, () => {
  it('completes an open task with the version it was read at, ticked at once', async () => {
    const answer = Promise.withResolvers<{ ok: boolean }>();
    vi.mocked(TaskActions.completeTask).mockReturnValue(answer.promise);
    await renderRow(TASK);

    await checkbox().click();

    expect(TaskActions.completeTask).toHaveBeenCalledWith(1, 42, 3);
    await expect.element(checkbox()).toBeChecked();
    answer.resolve({ ok: true });
  });

  it('completes from a round status circle, set apart from the square box that selects the row', async () => {
    await renderRow({ ...TASK, status: 'COMPLETED', completedAt: '2026-10-19T00:00:00Z' });

    const circle = getComputedStyle(checkbox().element());
    // Round: its corners curve by half its width or more.
    expect(px(circle.borderTopLeftRadius)).toBeGreaterThanOrEqual(px(circle.width) / 2);
    // Done, it fills with the green of Completed, its rim too: not the violet of a ticked box.
    await expect.element(checkbox()).toHaveAttribute('data-tone', 'green');
    const green = colorOf('var(--status-green)');
    expect(circle.backgroundColor).toBe(green);
    expect(circle.borderTopColor).toBe(green);
    expect(green).not.toBe(colorOf('var(--primary)'));
  });

  it('un-ticks the box and says why when completing fails', async () => {
    const answer = Promise.withResolvers<{ ok: boolean; message: string }>();
    vi.mocked(TaskActions.completeTask).mockReturnValue(answer.promise);
    await renderRow(TASK);

    await checkbox().click();
    // Ticked at once, before the answer.
    await expect.element(checkbox()).toBeChecked();
    answer.resolve({ ok: false, message: "This task's status changed meanwhile." });

    await expect.element(page.getByText("This task's status changed meanwhile.")).toBeVisible();
    await expect.element(checkbox()).not.toBeChecked();
  });

  it('un-ticks the box and toasts when the request never gets through, without the error boundary', async () => {
    // A rejected action in a transition would throw to the page's error boundary: an uncaught error.
    const uncaught: Event[] = [];
    const record = (event: Event) => uncaught.push(event);
    window.addEventListener('error', record);
    window.addEventListener('unhandledrejection', record);
    vi.mocked(TaskActions.completeTask).mockRejectedValue(new TypeError('Failed to fetch'));
    await renderRow(TASK);

    await checkbox().click();

    await expect
      .element(page.getByText("Couldn't reach the server. Check your connection and try again."))
      .toBeVisible();
    await expect.element(checkbox()).not.toBeChecked();
    expect(uncaught).toHaveLength(0);
    window.removeEventListener('error', record);
    window.removeEventListener('unhandledrejection', record);
  });

  it('offers a reload when the task changed meanwhile', async () => {
    vi.mocked(TaskActions.completeTask).mockResolvedValue({
      ok: false,
      message: "This task's status changed meanwhile. Reload to see it.",
      conflict: true,
    });
    await renderRow(TASK);

    await checkbox().click();

    await expect.element(page.getByRole('button', { name: 'Reload' })).toBeVisible();
  });

  it('moves an open task from its pill to Completed, or to Cancelled once confirmed', async () => {
    await renderRow(TASK);

    await pill('Open').click();
    await expect.element(page.getByRole('menuitem', { name: 'Cancelled' })).toBeVisible();
    expect(page.getByRole('menuitem', { name: 'Open' }).elements()).toHaveLength(0);
    await page.getByRole('menuitem', { name: 'Cancelled' }).click();
    await expect
      .element(page.getByRole('alertdialog', { name: 'Cancel “Send the proposal”?' }))
      .toBeVisible();
    expect(TaskActions.cancelTask).not.toHaveBeenCalled();
  });

  it('marks its pill to keep the focus only for a cancel confirmed, and drops it when refused', async () => {
    vi.mocked(TaskActions.cancelTask).mockResolvedValue({ ok: false, message: 'Not yours.' });
    await renderRow(TASK);
    const confirm = page.getByRole('alertdialog', { name: 'Cancel “Send the proposal”?' });

    // Kept: nothing changes, so a later redraw leaves the focus where it is.
    await pill('Open').click();
    await page.getByRole('menuitem', { name: 'Cancelled' }).click();
    await confirm.getByRole('button', { name: 'Keep it' }).click();
    await expect.element(confirm).not.toBeInTheDocument();
    expect(used()).toBeUndefined();

    // Confirmed and refused: the refusal says so, and the mark goes again.
    await pill('Open').click();
    await page.getByRole('menuitem', { name: 'Cancelled' }).click();
    await confirm.getByRole('button', { name: 'Cancel task' }).click();
    await expect.element(confirm.getByText('Not yours.')).toBeVisible();
    expect(TaskActions.cancelTask).toHaveBeenCalledWith(1, 42, 3);
    expect(used()).toBeUndefined();
  });

  it('reopens a completed task from its pill, waiting for the server', async () => {
    const answer = Promise.withResolvers<{ ok: boolean }>();
    vi.mocked(TaskActions.reopenTask).mockReturnValue(answer.promise);
    await renderRow({ ...TASK, status: 'COMPLETED', completedAt: '2026-10-19T00:00:00Z' });

    await pill('Completed').click();
    expect(page.getByRole('menuitem', { name: 'Cancelled' }).elements()).toHaveLength(0);
    await page.getByRole('menuitem', { name: 'Open' }).click();

    expect(TaskActions.reopenTask).toHaveBeenCalledWith(1, 42, 3);
    // Still Completed, and busy, until the server answers.
    await expect.element(pill('Completed')).toHaveAttribute('aria-busy', 'true');
    answer.resolve({ ok: true });
    await expect.element(page.getByText('“Send the proposal” reopened')).toBeVisible();
  });

  it('hands the focus to the task’s pill in its new section, not the list’s heading', async () => {
    vi.mocked(TaskActions.reopenTask).mockResolvedValue({ ok: true });
    const done: Task = { ...TASK, status: 'COMPLETED', completedAt: '2026-10-19T00:00:00Z' };
    const screen = await render(twoSections(done, 'completed'));

    await pill('Completed').click();
    await page.getByRole('menuitem', { name: 'Open' }).click();
    await expect.element(pill('Completed')).not.toHaveAttribute('aria-busy');
    await screen.rerender(twoSections({ ...TASK, version: 4 }, 'open'));

    await expect.element(pill('Open')).toHaveFocus();
  });

  it('keeps the old status and says why under the pill when the server refuses', async () => {
    vi.mocked(TaskActions.reopenTask).mockResolvedValue({
      ok: false,
      message: "This task's status changed meanwhile. Reload to see it.",
      conflict: true,
    });
    await renderRow({ ...TASK, status: 'COMPLETED', completedAt: '2026-10-19T00:00:00Z' });

    await pill('Completed').click();
    await page.getByRole('menuitem', { name: 'Open' }).click();

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent("This task's status changed meanwhile. Reload to see it.");
    await expect.element(page.getByRole('button', { name: 'Reload' })).toBeVisible();
    await expect.element(pill('Completed')).not.toHaveAttribute('aria-busy');
  });

  it('keeps the due date and the due time each whole, so a narrow cell breaks only between them', async () => {
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <TaskDue dueAt="2026-10-19T09:30:00Z" overdue={false} timeZone="Asia/Bangkok" />
      </NextIntlClientProvider>,
    );

    const due = page.getByText(/^Oct 19, 2026, 4:30\sPM$/u);
    await expect.element(due).toBeVisible();
    const kept = [...due.element().querySelectorAll('.whitespace-nowrap')].map((part) =>
      part.textContent.replaceAll(/\s/gu, ' '),
    );
    expect(kept).toStrictEqual(['Oct 19, 2026', '4:30 PM']);
  });

  it('marks an overdue task in words, not colour alone', async () => {
    await page.viewport(1280, 800);
    await renderRow({ ...TASK, overdue: true, dueAt: '2026-10-10T02:00:00Z' });

    // The due column says so, and on a phone the title's cell (the column is hidden there).
    await expect.element(page.getByRole('cell', { name: /^Overdue/u })).toBeVisible();
    expect(page.getByText('Overdue', { exact: true }).elements()).toHaveLength(2);
  });

  it('keeps a compact row to its title, due time and menu, with the linked records beside the title', async () => {
    await page.viewport(1280, 800);
    await renderRow(TASK, true);

    // The priority and the assignee are columns of the full row; the company joins the title.
    expect(page.getByRole('cell').elements()).toHaveLength(4);
    expect(page.getByText('High').elements()).toHaveLength(0);
    expect(page.getByText('Mia Manager').elements()).toHaveLength(0);
    await expect.element(page.getByRole('link', { name: 'Acme' })).toBeVisible();
    expect(sameLine('Send the proposal', 'Acme')).toBeTruthy();
    await expect.element(menu()).toBeVisible();
  });

  it('draws a 36 px row: its number beside its title, its due time whole on one line', async () => {
    await page.viewport(1280, 800);
    await renderRow({ ...TASK, overdue: true, dueAt: '2026-10-10T02:00:00Z' });

    expect(page.getByRole('row').element().getBoundingClientRect().height).toBe(36);
    expect(sameLine('Send the proposal', 'T-0042')).toBeTruthy();
    const due = page.getByRole('cell', { name: /^Overdue Oct 10, 2026, 9:00\sAM$/u });
    await expect.element(due).toBeVisible();
    // Its icon beside it, on the one line.
    expect(due.element().getBoundingClientRect().height).toBe(36);
  });

  it('says "Overdue" to assistive technology only in the Overdue section, whose heading says it', async () => {
    await renderRow({ ...TASK, overdue: true, dueAt: '2026-10-10T02:00:00Z' }, false, true);

    await expect.element(page.getByRole('cell', { name: /^Overdue Oct 10/u })).toBeVisible();
    expect(
      page
        .getByText('Overdue', { exact: true })
        .elements()
        .every((word) => word.classList.contains('sr-only')),
    ).toBeTruthy();
  });

  it.each([
    ['full', false],
    ['compact', true],
  ])(
    'lists a %s row\'s linked records under its title on a phone, the first and "+N"',
    async (_, compact) => {
      await page.viewport(390, 844);
      await renderRow({ ...TASK, deal: { id: 4, name: 'Acme renewal' } }, compact);

      await expect.element(page.getByRole('link', { name: 'Acme', exact: true })).toBeVisible();
      await expect
        .element(page.getByRole('link', { name: '1 more: Acme renewal' }))
        .toHaveTextContent('+1');
    },
  );

  it('lists the linked records on one line, the first and "+N" for the rest, all in its tooltip', async () => {
    await page.viewport(1280, 800);
    await renderRow({
      ...TASK,
      contact: { id: 9, fullName: 'Noa Park' },
      deal: { id: 4, name: 'Acme renewal' },
    });
    const more = page.getByRole('link', { name: '2 more: Noa Park, Acme renewal' });

    await expect.element(page.getByRole('link', { name: 'Acme', exact: true })).toBeVisible();
    await expect.element(more).toHaveTextContent('+2');
    expect(page.getByRole('row').element().getBoundingClientRect().height).toBe(36);
    await more.hover();
    await expect.element(page.getByRole('tooltip')).toHaveTextContent('AcmeNoa ParkAcme renewal');
  });
});
