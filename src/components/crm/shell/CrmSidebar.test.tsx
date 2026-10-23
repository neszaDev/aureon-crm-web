import '@/styles/global.css';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SIDEBAR_KEY, SIDEBAR_SCRIPT } from '@/libs/crm/Sidebar';
import type * as Navigation from '@/libs/I18nNavigation';
import messages from '@/locales/en.json';
import { CrmSidebar } from './CrmSidebar';

vi.mock(import('@/libs/I18nNavigation'), async (importOriginal) => ({
  ...(await importOriginal()),
  usePathname: vi.fn<typeof Navigation.usePathname>(() => '/app/1/companies'),
}));

const renderSidebar = async () =>
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <TooltipProvider>
        <input aria-label="Notes" />
        <CrmSidebar
          workspace={{ id: 1, name: 'Northwind Supply' }}
          workspaces={[{ id: 1, name: 'Northwind Supply', role: 'OWNER' }]}
        />
      </TooltipProvider>
    </NextIntlClientProvider>,
  );

const sidebar = () => document.querySelector<HTMLElement>('#crm-sidebar');
const width = () => sidebar()?.getBoundingClientRect().width;
const toggle = (name: 'Collapse sidebar' | 'Expand sidebar') =>
  page.getByRole('button', { name, exact: true });
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
    await page.viewport(1440, 900);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('collapses to its icon strip from its toggle and back, and remembers each choice', async () => {
    await renderSidebar();

    await expect.element(toggle('Collapse sidebar')).toHaveAttribute('aria-expanded', 'true');
    await expect
      .element(toggle('Collapse sidebar'))
      .toHaveAttribute('aria-controls', 'crm-sidebar');
    expect(width()).toBe(240);

    await toggle('Collapse sidebar').click();

    await expect.element(toggle('Expand sidebar')).toHaveAttribute('aria-expanded', 'false');
    expect(document.documentElement.dataset.sidebar).toBe('collapsed');
    expect(localStorage.getItem(SIDEBAR_KEY)).toBe('collapsed');
    await expect.poll(width).toBe(56);
    // The links keep their names, the current one its mark, and a tooltip names each icon.
    const companies = page.getByRole('link', { name: 'Companies' });
    await expect.element(companies).toHaveAttribute('aria-current', 'page');
    await companies.hover();
    await expect.element(page.getByRole('tooltip', { name: 'Companies' })).toBeInTheDocument();

    await toggle('Expand sidebar').click();

    await expect.element(toggle('Collapse sidebar')).toBeVisible();
    expect(localStorage.getItem(SIDEBAR_KEY)).toBe('expanded');
    await expect.poll(width).toBe(240);
  });

  it('starts as the stored choice, at its width from the first paint', async () => {
    localStorage.setItem(SIDEBAR_KEY, 'collapsed');
    runHeadScript();
    await renderSidebar();

    // No width transition: it was never drawn expanded.
    expect(width()).toBe(56);
    expect(sidebar()?.getAnimations()).toHaveLength(0);
    await expect.element(toggle('Expand sidebar')).toHaveAttribute('aria-expanded', 'false');
  });

  it('starts as the strip from 768 to 1279 px, and expanded there once the viewer chose it', async () => {
    await page.viewport(1024, 800);
    await renderSidebar();

    expect(width()).toBe(56);
    await toggle('Expand sidebar').click();
    await expect.poll(width).toBe(240);
    expect(localStorage.getItem(SIDEBAR_KEY)).toBe('expanded');
  });

  it('toggles with Ctrl+\\ and Cmd+\\, but not while typing in a field', async () => {
    await renderSidebar();

    pressToggleKey({ ctrlKey: true });
    await expect.element(toggle('Expand sidebar')).toBeInTheDocument();
    pressToggleKey({ metaKey: true });
    await expect.element(toggle('Collapse sidebar')).toBeInTheDocument();
    // The tooltip says so.
    await toggle('Collapse sidebar').hover();
    await expect
      .element(page.getByRole('tooltip'))
      .toHaveTextContent(/Collapse sidebar(⌘\\|Ctrl \\)/u);

    await userEvent.click(page.getByRole('textbox', { name: 'Notes' }));
    pressToggleKey({ ctrlKey: true });
    expect(document.documentElement.dataset.sidebar).toBe('expanded');
    await expect.element(toggle('Collapse sidebar')).toBeInTheDocument();
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

    expect(document.documentElement.dataset.sidebar).toBeUndefined();
    expect(width()).toBe(240);
    await toggle('Collapse sidebar').click();
    await expect.poll(width).toBe(56);
  });
});
