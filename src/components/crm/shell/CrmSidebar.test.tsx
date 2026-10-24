import '@/styles/global.css';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SIDEBAR_KEY, SIDEBAR_SCRIPT, SPACES_KEY } from '@/libs/crm/Sidebar';
import * as Navigation from '@/libs/I18nNavigation';
import messages from '@/locales/en.json';
import { CrmSidebar } from './CrmSidebar';
import { CrmStrip } from './CrmStrip';

vi.mock(import('@/libs/I18nNavigation'), async (importOriginal) => ({
  ...(await importOriginal()),
  usePathname: vi.fn<typeof Navigation.usePathname>(),
  useSearchParams: vi.fn<typeof Navigation.useSearchParams>(),
}));

const ME = 7;

/**
 * Renders the sidebar beside the rail's strip, as the shell does, at a URL.
 * @param url The page's path and query.
 */
const renderSidebar = async (url = '/app/1/companies') => {
  const [path = '', search = ''] = url.split('?');
  vi.mocked(Navigation.usePathname).mockReturnValue(path);
  // @ts-expect-error -- the search params the nav reads
  vi.mocked(Navigation.useSearchParams).mockReturnValue(new URLSearchParams(search));
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <TooltipProvider>
        <input aria-label="Notes" />
        <div contentEditable suppressContentEditableWarning>
          Rich notes
        </div>
        <div className="flex">
          <div className="flex flex-col bg-rail">
            <CrmStrip workspaceId={1} />
          </div>
          <CrmSidebar
            workspace={{ id: 1, name: 'Northwind Supply', timeZone: 'UTC' }}
            workspaces={[{ id: 1, name: 'Northwind Supply', role: 'OWNER' }]}
            me={ME}
          />
        </div>
      </TooltipProvider>
    </NextIntlClientProvider>,
  );
};

const sidebar = () => document.querySelector<HTMLElement>('#crm-sidebar');
const width = () => sidebar()?.getBoundingClientRect().width;
const visibility = () => {
  const element = sidebar();
  return element ? getComputedStyle(element).visibility : '';
};
// The sidebar's sections, or the rail's strip of them while it is folded.
const nav = () => page.getByRole('navigation', { name: 'Workspace navigation' });
const toggle = (name: 'Collapse sidebar' | 'Expand sidebar') =>
  page.getByRole('button', { name, exact: true });
const views = (space: string) => page.getByRole('button', { name: `${space} views` });
// A space's open views: each one's name and where it goes.
const viewLinks = (space: string) =>
  page
    .getByRole('list', { name: `${space} views` })
    .getByRole('link')
    .elements()
    .map((link) => [link.textContent, link.getAttribute('href')]);
// What the page's <head> runs before the first paint.
const runHeadScript = () => {
  const script = document.createElement('script');
  script.textContent = SIDEBAR_SCRIPT;
  document.head.append(script);
  script.remove();
};
const pressToggleKey = (init: KeyboardEventInit) =>
  (document.activeElement ?? document.body).dispatchEvent(
    new KeyboardEvent('keydown', { key: '\\', code: 'Backslash', bubbles: true, ...init }),
  );

describe(CrmSidebar, () => {
  beforeEach(async () => {
    localStorage.clear();
    delete document.documentElement.dataset.sidebar;
    delete document.documentElement.dataset.spaces;
    await page.viewport(1440, 900);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('folded into the rail', () => {
    it('folds from its toggle, and expands again from the rail, remembering each choice', async () => {
      await renderSidebar();
      await expect.element(toggle('Collapse sidebar')).toHaveAttribute('aria-expanded', 'true');
      await expect
        .element(toggle('Collapse sidebar'))
        .toHaveAttribute('aria-keyshortcuts', 'Control+\\ Meta+\\');

      await toggle('Collapse sidebar').click();

      await expect
        .element(toggle('Expand sidebar'))
        .toHaveAttribute('aria-controls', 'crm-sidebar');
      expect(localStorage.getItem(SIDEBAR_KEY)).toBe('collapsed');

      await toggle('Expand sidebar').click();

      await expect.element(toggle('Collapse sidebar')).toBeVisible();
      expect(localStorage.getItem(SIDEBAR_KEY)).toBe('expanded');
    });

    it('goes entirely, so the rail is the one strip', async () => {
      await renderSidebar();
      expect(width()).toBe(240);

      await toggle('Collapse sidebar').click();

      await expect.poll(width).toBe(0);
      await expect.poll(visibility).toBe('hidden');
      await toggle('Expand sidebar').click();
      await expect.poll(width).toBe(240);
    });

    it('puts the sections on the rail, each named, the current one marked', async () => {
      await renderSidebar();
      // Expanded, the rail has no copy of them.
      expect(nav().elements()).toHaveLength(1);

      await toggle('Collapse sidebar').click();

      await expect.poll(() => nav().getByRole('link').elements().length).toBe(8);
      expect(
        nav()
          .getByRole('link')
          .elements()
          .map((link) => link.getAttribute('aria-label')),
      ).toStrictEqual([
        'Companies',
        'Contacts',
        'Leads',
        'Deals',
        'Tasks',
        'Dashboard',
        'Reports',
        'Settings',
      ]);
      const companies = nav().getByRole('link', { name: 'Companies' });
      await expect.element(companies).toHaveAttribute('aria-current', 'page');
      // The orbit's satellite beside its fill, on it alone.
      expect(
        nav()
          .getByRole('link')
          .elements()
          .map((link) => link.querySelector('[data-satellite]') !== null),
      ).toStrictEqual([true, false, false, false, false, false, false, false]);
    });

    it('names each section on the rail in a tooltip', async () => {
      await renderSidebar();
      await toggle('Collapse sidebar').click();
      // Once the sidebar has gone: its own links read out until then.
      await expect.poll(visibility).toBe('hidden');

      await nav().getByRole('link', { name: 'Companies' }).hover();

      await expect.element(page.getByRole('tooltip', { name: 'Companies' })).toBeInTheDocument();
    });

    it('starts as the stored choice, at its width from the first paint', async () => {
      localStorage.setItem(SIDEBAR_KEY, 'collapsed');
      runHeadScript();
      await renderSidebar();

      // No width transition: it was never drawn expanded.
      expect(width()).toBe(0);
      expect(sidebar()?.getAnimations()).toHaveLength(0);
      await expect.element(toggle('Expand sidebar')).toHaveAttribute('aria-expanded', 'false');
    });

    it('starts folded from 768 to 1279 px, and expanded there once the viewer chose it', async () => {
      await page.viewport(1024, 800);
      await renderSidebar();

      expect(width()).toBe(0);
      await toggle('Expand sidebar').click();
      await expect.poll(width).toBe(240);
      expect(localStorage.getItem(SIDEBAR_KEY)).toBe('expanded');
    });
  });

  it('toggles with Ctrl+\\ and Cmd+\\, but not while typing in a field', async () => {
    await renderSidebar();

    pressToggleKey({ ctrlKey: true });
    await expect.element(toggle('Expand sidebar')).toBeVisible();
    pressToggleKey({ metaKey: true });
    await expect.element(toggle('Collapse sidebar')).toBeVisible();
    // The tooltip says so.
    await toggle('Collapse sidebar').hover();
    await expect
      .element(page.getByRole('tooltip'))
      .toHaveTextContent(/Collapse sidebar(⌘\\|Ctrl \\)/u);

    // A held key's repeats don't flicker it, nor does typing.
    pressToggleKey({ ctrlKey: true, repeat: true });
    await userEvent.click(page.getByRole('textbox', { name: 'Notes' }));
    pressToggleKey({ ctrlKey: true });
    await userEvent.click(page.getByText('Rich notes'));
    pressToggleKey({ metaKey: true });
    expect(document.documentElement.dataset.sidebar).toBe('expanded');
  });

  it('puts the stored choices back when React rendered <html> without them', async () => {
    localStorage.setItem(SIDEBAR_KEY, 'collapsed');
    localStorage.setItem(SPACES_KEY, 'deals');
    // No head script: the root layout was rendered anew, its attributes cleared.
    await renderSidebar();

    expect(document.documentElement.dataset.sidebar).toBe('collapsed');
    expect(document.documentElement.dataset.spaces).toBe('deals');
    await expect.element(toggle('Expand sidebar')).toBeVisible();
  });

  it('ignores stored values it does not know', async () => {
    localStorage.setItem(SIDEBAR_KEY, 'x" onload=1');
    localStorage.setItem(SPACES_KEY, 'deals" onload=1');
    runHeadScript();
    await renderSidebar();

    expect(document.documentElement.dataset.sidebar).toBeUndefined();
    expect(document.documentElement.dataset.spaces).toBeUndefined();
    expect(width()).toBe(240);
  });

  it('still toggles, and renders by width, when storage is off', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    runHeadScript();
    await renderSidebar();

    expect(width()).toBe(240);
    await views('Deals').click();
    await expect.element(views('Deals')).toHaveAttribute('aria-expanded', 'true');
    await toggle('Collapse sidebar').click();
    await expect.poll(width).toBe(0);
  });

  describe('the tree of saved views', () => {
    it('opens a space to its views, out of reach while it is closed', async () => {
      await renderSidebar('/app/1/deals');
      await expect.element(views('Deals')).toHaveAttribute('aria-expanded', 'false');
      // Not drawn, not read out.
      await expect
        .element(nav().getByRole('link', { name: 'Board', exact: true }))
        .not.toBeInTheDocument();

      await views('Deals').click();

      await expect.element(views('Deals')).toHaveAttribute('aria-expanded', 'true');
      expect(viewLinks('Deals')).toStrictEqual([
        ['Board', '/app/1/deals'],
        ['List', '/app/1/deals?view=list'],
        ['Mine', `/app/1/deals?ownerId=${ME}`],
      ]);
    });

    it('remembers which spaces are open, and closes one again', async () => {
      await renderSidebar('/app/1/deals');

      for (const space of ['Deals', 'Leads', 'Tasks']) {
        // oxlint-disable-next-line no-await-in-loop -- one space after another
        await views(space).click();
      }
      expect(localStorage.getItem(SPACES_KEY)).toBe('deals leads tasks');
      await views('Leads').click();

      await expect.element(views('Leads')).toHaveAttribute('aria-expanded', 'false');
      expect(localStorage.getItem(SPACES_KEY)).toBe('deals tasks');
    });

    it('opens the records’ spaces to all, the caller’s and the archived', async () => {
      localStorage.setItem(SPACES_KEY, 'companies contacts');
      runHeadScript();
      await renderSidebar();

      expect(viewLinks('Companies')).toStrictEqual([
        ['All', '/app/1/companies'],
        ['Mine', `/app/1/companies?ownerId=${ME}`],
        ['Archived', '/app/1/companies?archived=true'],
      ]);
      expect(viewLinks('Contacts')).toStrictEqual([
        ['All', '/app/1/contacts'],
        ['Mine', `/app/1/contacts?ownerId=${ME}`],
        ['Archived', '/app/1/contacts?archived=true'],
      ]);
    });

    it('opens leads to their follow-ups due and tasks to their due sections', async () => {
      localStorage.setItem(SPACES_KEY, 'leads tasks');
      runHeadScript();
      await renderSidebar();
      const today = new Date().toISOString().slice(0, 10);

      expect(viewLinks('Leads')).toStrictEqual([
        ['All', '/app/1/leads'],
        ['Mine', `/app/1/leads?ownerId=${ME}`],
        [
          'To follow up',
          `/app/1/leads?status=NEW&status=CONTACTED&status=QUALIFIED&followUpBefore=${today}&sort=FOLLOW_UP_DATE&direction=ASC`,
        ],
      ]);
      expect(viewLinks('Tasks')).toStrictEqual([
        ['My tasks', `/app/1/tasks?assigneeId=${ME}`],
        ['Overdue', '/app/1/tasks?view=overdue'],
        ['Next 7 days', '/app/1/tasks?view=week'],
        ['Completed', '/app/1/tasks?view=completed'],
      ]);
    });

    it('draws the spaces the viewer left open from the first paint', async () => {
      localStorage.setItem(SPACES_KEY, 'deals');
      runHeadScript();
      await renderSidebar('/app/1/deals');

      expect(
        nav().getByRole('link', { name: 'List', exact: true }).element().checkVisibility(),
      ).toBeTruthy();
      await expect.element(views('Deals')).toHaveAttribute('aria-expanded', 'true');
    });

    it('marks the most specific view the URL matches as the page, and its space as holding it', async () => {
      localStorage.setItem(SPACES_KEY, 'deals');
      runHeadScript();
      await renderSidebar('/app/1/deals?view=list&sort=NAME');
      const deals = nav().getByRole('link', { name: 'Deals', exact: true });

      await expect
        .element(nav().getByRole('link', { name: 'List' }))
        .toHaveAttribute('aria-current', 'page');
      await expect
        .element(nav().getByRole('link', { name: 'Board', exact: true }))
        .not.toHaveAttribute('aria-current');
      await expect.element(deals).toHaveAttribute('aria-current', 'true');
      // The space's icon carries the orbit's satellite; nothing else in the sidebar does.
      expect(
        [...document.querySelectorAll('#crm-sidebar [data-satellite]')].map((dot) =>
          deals.element().contains(dot),
        ),
      ).toStrictEqual([true]);
    });

    it('marks the space itself where none of its views matches', async () => {
      localStorage.setItem(SPACES_KEY, 'tasks');
      runHeadScript();
      await renderSidebar('/app/1/tasks');

      await expect
        .element(nav().getByRole('link', { name: 'Tasks', exact: true }))
        .toHaveAttribute('aria-current', 'page');
      await expect
        .element(nav().getByRole('link', { name: 'Overdue' }))
        .not.toHaveAttribute('aria-current');
    });

    it('marks the space itself on a record of it', async () => {
      localStorage.setItem(SPACES_KEY, 'deals');
      runHeadScript();
      await renderSidebar('/app/1/deals/12');

      await expect
        .element(nav().getByRole('link', { name: 'Deals', exact: true }))
        .toHaveAttribute('aria-current', 'page');
      await expect
        .element(nav().getByRole('link', { name: 'Board', exact: true }))
        .not.toHaveAttribute('aria-current');
    });
  });
});
