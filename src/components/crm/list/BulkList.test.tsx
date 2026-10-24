import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import type { Locator } from 'vitest/browser';
import { page, userEvent } from 'vitest/browser';
import * as CompanyActions from '@/actions/crm/CompanyActions';
import { Table, TableBody, TableHeader, TableRow } from '@/components/ui/table';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { ActionResult } from '@/libs/api/ApiError';
import type { BulkItem } from '@/libs/crm/BulkSelection';
import messages from '@/locales/en.json';
import { BulkList } from './BulkList';
import { BulkSection, SelectAllHead, SelectCell } from './BulkSelect';

type Send = () => Promise<ActionResult>;

// @ts-expect-error -- only what the bar uses
vi.mock(import('@/libs/I18nNavigation'), () => ({
  useRouter: () => ({ refresh: vi.fn<() => void>() }),
}));
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
vi.mock(import('@/actions/crm/DealActions'), () => ({
  assignDeal: vi.fn<Send>(),
  moveDeal: vi.fn<Send>(),
  archiveDeal: vi.fn<Send>(),
  restoreDeal: vi.fn<Send>(),
}));
vi.mock(import('@/actions/crm/LeadActions'), () => ({
  changeLeadStatus: vi.fn<Send>(),
  assignLead: vi.fn<Send>(),
  archiveLead: vi.fn<Send>(),
  restoreLead: vi.fn<Send>(),
}));
vi.mock(import('@/actions/crm/TaskActions'), () => ({
  assignTask: vi.fn<Send>(),
  completeTask: vi.fn<Send>(),
  reopenTask: vi.fn<Send>(),
  cancelTask: vi.fn<Send>(),
}));

const item = (id: number, name: string): BulkItem => ({ id, name, version: 1, mayEdit: true });
const NEW = [item(1, 'Acme'), item(2, 'Brightwater'), item(3, 'Cobalt')];
const WON = [item(4, 'Dunford')];

const Section = (props: { rows: BulkItem[]; heading: string }) => (
  <section>
    <h3 id={`heading-${props.heading}`}>{props.heading}</h3>
    <BulkSection ids={props.rows.map((row) => row.id)} labelledBy={`heading-${props.heading}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <SelectAllHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.rows.map((row) => (
            <TableRow key={row.id} className="group/row">
              <SelectCell id={row.id} name={row.name} />
              <td>
                <a href={`#${row.id}`}>{row.name}</a>
              </td>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </BulkSection>
  </section>
);

const List = (props: { scope: string; sections: BulkItem[][] }) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <TooltipProvider>
      <h2 id="companies-heading" tabIndex={-1}>
        Companies
      </h2>
      <BulkList
        scope={props.scope}
        items={props.sections.flat()}
        bar={{
          entity: 'company',
          workspaceId: 1,
          members: [],
          mayAssign: false,
          archived: false,
          headingId: 'companies-heading',
        }}
      >
        {props.sections.map((rows, index) => (
          <Section key={rows[0]?.id} rows={rows} heading={index === 0 ? 'New' : 'Won'} />
        ))}
        {/* A field in the list, as an inline-add row has. */}
        <input aria-label="New company" />
      </BulkList>
    </TooltipProvider>
  </NextIntlClientProvider>
);

const focus = (locator: Locator) => {
  const node = locator.element();
  if (node instanceof HTMLElement) {
    node.focus();
  }
};
const box = (name: string) => page.getByRole('checkbox', { name: `Select ${name}` });
const all = (section: string) =>
  page.getByRole('checkbox', { name: `Select all ${section}`, exact: true });
const toolbar = () => page.getByRole('toolbar');
const shortcut = () => page.getByRole('button', { name: 'Go to bulk actions' });
const rowOf = (name: string) => page.getByRole('row').filter({ hasText: name });

describe(BulkList, () => {
  it('selects rows, shows the bar with the count, and marks the section’s box mixed, then all', async () => {
    await render(<List scope="a" sections={[NEW, WON]} />);

    await box('Acme').click();
    await expect.element(toolbar()).toHaveAccessibleName('1 selected');
    await expect.element(all('New')).toHaveAttribute('aria-checked', 'mixed');
    await expect.element(all('Won')).toHaveAttribute('aria-checked', 'false');

    await all('New').click();
    await expect.element(toolbar()).toHaveAccessibleName('3 selected');
    await expect.element(all('New')).toHaveAttribute('aria-checked', 'true');

    await all('New').click();
    await expect.element(toolbar()).not.toBeInTheDocument();
  });

  it('selects a range with Shift, by mouse and by keyboard, within the section', async () => {
    await render(<List scope="a" sections={[NEW, WON]} />);

    await box('Acme').click();
    await userEvent.keyboard('{Shift>}');
    await box('Cobalt').click();
    await userEvent.keyboard('{/Shift}');
    await expect.element(toolbar()).toHaveAccessibleName('3 selected');

    // By keyboard: Space toggles Acme out (the anchor); Shift+Space on Brightwater takes the
    // range from Acme to it out too.
    focus(box('Acme'));
    await userEvent.keyboard(' ');
    focus(box('Brightwater'));
    await userEvent.keyboard('{Shift>} {/Shift}');
    await expect.element(toolbar()).toHaveAccessibleName('1 selected');
    await expect.element(box('Cobalt')).toHaveAttribute('aria-checked', 'true');
    await expect.element(box('Brightwater')).toHaveAttribute('aria-checked', 'false');
  });

  it('selects the row whose name has the focus with Space, and clears with Escape', async () => {
    await render(<List scope="a" sections={[NEW, WON]} />);

    focus(page.getByRole('link', { name: 'Dunford' }));
    await userEvent.keyboard(' ');
    await expect.element(box('Dunford')).toHaveAttribute('aria-checked', 'true');
    await expect.element(toolbar()).toHaveAccessibleName('1 selected');

    await userEvent.keyboard('{Escape}');
    await expect.element(toolbar()).not.toBeInTheDocument();
    await expect.element(box('Dunford')).toHaveAttribute('aria-checked', 'false');
  });

  it('leaves the selection alone on Escape in a text field: the field takes it', async () => {
    await render(<List scope="a" sections={[NEW, WON]} />);
    await box('Acme').click();

    await page.getByRole('textbox', { name: 'New company' }).click();
    await userEvent.keyboard('{Escape}');

    await expect.element(toolbar()).toHaveAccessibleName('1 selected');
  });

  it('keeps only the rows still there after a refresh, and clears for another list state', async () => {
    const { rerender } = await render(<List scope="a" sections={[NEW, WON]} />);
    await all('New').click();
    await expect.element(toolbar()).toHaveAccessibleName('3 selected');

    // Brightwater left the list (archived elsewhere).
    await rerender(<List scope="a" sections={[NEW.filter((row) => row.id !== 2), WON]} />);
    await expect.element(toolbar()).toHaveAccessibleName('2 selected');

    // Another group, filter, sort or page.
    await rerender(<List scope="b" sections={[NEW, WON]} />);
    await expect.element(toolbar()).not.toBeInTheDocument();
    await expect.element(box('Acme')).toHaveAttribute('aria-checked', 'false');
  });

  it('forgets a row that left the list, so it comes back unselected', async () => {
    const { rerender } = await render(<List scope="a" sections={[NEW, WON]} />);
    await box('Acme').click();
    await box('Brightwater').click();

    // Brightwater left the list (archived elsewhere), then came back (restored).
    await rerender(<List scope="a" sections={[NEW.filter((row) => row.id !== 2), WON]} />);
    await expect.element(toolbar()).toHaveAccessibleName('1 selected');
    await rerender(<List scope="a" sections={[NEW, WON]} />);

    await expect.element(toolbar()).toHaveAccessibleName('1 selected');
    await expect.element(box('Brightwater')).toHaveAttribute('aria-checked', 'false');
  });

  it('forgets the selection of a list state once another is shown, when the first comes back', async () => {
    const { rerender } = await render(<List scope="a" sections={[NEW, WON]} />);
    await all('New').click();
    await expect.element(toolbar()).toHaveAccessibleName('3 selected');

    await rerender(<List scope="b" sections={[NEW, WON]} />);
    await expect.element(toolbar()).not.toBeInTheDocument();
    await rerender(<List scope="a" sections={[NEW, WON]} />);

    await expect.element(toolbar()).not.toBeInTheDocument();
    await expect.element(box('Acme')).toHaveAttribute('aria-checked', 'false');
  });

  it('offers a way to the bar from the section’s select-all box while rows are selected', async () => {
    await render(<List scope="a" sections={[NEW, WON]} />);
    expect(shortcut().elements()).toHaveLength(0);

    await box('Acme').click();
    focus(all('New'));
    await userEvent.keyboard('{Tab}');
    await expect.element(shortcut().first()).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    await expect.element(toolbar().getByRole('button', { name: 'Archive' })).toHaveFocus();
  });

  it('offers a way to the bar right after a ticked row’s own box, in one Tab', async () => {
    await render(<List scope="a" sections={[NEW, WON]} />);

    focus(box('Dunford'));
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{Tab}');

    await expect
      .element(rowOf('Dunford').getByRole('button', { name: 'Go to bulk actions' }))
      .toHaveFocus();
    // Only the ticked row has one.
    expect(rowOf('Acme').getByRole('button').elements()).toHaveLength(0);
    await userEvent.keyboard('{Enter}');
    await expect.element(toolbar().getByRole('button', { name: 'Archive' })).toHaveFocus();
  });

  it('hands the focus to the list’s heading when the bar clears with it', async () => {
    await render(<List scope="a" sections={[NEW, WON]} />);
    await box('Acme').click();

    await toolbar().getByRole('button', { name: 'Clear selection' }).click();

    await expect.element(page.getByRole('heading', { name: 'Companies' })).toHaveFocus();
  });

  // Brightwater is refused, and stays selected with its reason above the bar.
  const refuseBrightwater = async () => {
    vi.mocked(CompanyActions.archiveCompany).mockImplementation(
      async (_workspace, id) =>
        await Promise.resolve(
          id === 2 ? { ok: false, message: 'Your role doesn’t allow this.' } : { ok: true },
        ),
    );
    await box('Acme').click();
    await box('Brightwater').click();
    await toolbar().getByRole('button', { name: 'Archive' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Archive' }).click();
    await expect.element(page.getByRole('alert')).toHaveTextContent('Brightwater');
    await expect.element(toolbar()).toHaveAccessibleName('1 selected');
  };

  it('keeps the refusals on screen when the selection clears, until they are dismissed', async () => {
    await render(<List scope="a" sections={[NEW, WON]} />);
    await refuseBrightwater();

    await userEvent.keyboard('{Escape}');
    await expect.element(toolbar()).not.toBeInTheDocument();
    await expect.element(page.getByRole('alert')).toHaveTextContent('Brightwater');

    await page.getByRole('button', { name: 'Dismiss' }).click();
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
    await box('Cobalt').click();
    await expect.element(toolbar()).toHaveAccessibleName('1 selected');
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
  });

  it('drops the bar and the refusals with its ×', async () => {
    await render(<List scope="a" sections={[NEW, WON]} />);
    await refuseBrightwater();

    await toolbar().getByRole('button', { name: 'Clear selection' }).click();

    await expect.element(toolbar()).not.toBeInTheDocument();
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
  });

  it('still names a refused record that has left the list, until the list state changes', async () => {
    const { rerender } = await render(<List scope="a" sections={[NEW, WON]} />);
    await refuseBrightwater();

    // Brightwater left the list meanwhile (archived by someone else).
    await rerender(<List scope="a" sections={[NEW.filter((row) => row.id !== 2), WON]} />);
    await expect.element(toolbar()).not.toBeInTheDocument();
    await expect.element(page.getByRole('alert')).toHaveTextContent('Brightwater');

    await rerender(<List scope="b" sections={[NEW.filter((row) => row.id !== 2), WON]} />);
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
  });
  describe('on a desktop', () => {
    afterEach(async () => {
      await page.viewport(414, 896);
    });

    it('clears with one Escape from the bar: no tooltip takes it first', async () => {
      await page.viewport(1280, 800);
      await render(<List scope="a" sections={[NEW, WON]} />);
      await box('Acme').click();
      focus(box('Acme'));
      await userEvent.keyboard('{Tab}');
      await userEvent.keyboard('{Enter}');
      const archive = toolbar().getByRole('button', { name: 'Archive' });
      await expect.element(archive).toHaveFocus();
      // Its name is on it: no tooltip describes it again.
      await expect.element(archive).not.toHaveAttribute('aria-describedby');

      await userEvent.keyboard('{Escape}');

      await expect.element(toolbar()).not.toBeInTheDocument();
      await expect.element(box('Acme')).not.toBeChecked();
    });
  });
});
